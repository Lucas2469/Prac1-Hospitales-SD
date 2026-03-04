/**
 * heartbeat.service.js – Tarea 3.4: Monitor de Heartbeat Parametrizable
 *
 * Ejecuta un watcher cada 15 segundos que revisa todos los clientes en MongoDB.
 * Si la diferencia entre ahora y su 'lastSeenAt' supera HEARTBEAT_THRESHOLD,
 * el nodo se marca como NO_REPORTA y se genera un Log de advertencia.
 *
 * El umbral es parametrizable via la variable de entorno:
 *   HEARTBEAT_THRESHOLD = milisegundos (default: 60000 = 60s)
 *
 * Soporta nodos ilimitados: la query opera sobre todos los docs de la colección.
 */

import Client from "../models/Client.js";
import Log from "../models/Log.js";

export const startHeartbeatWatcher = () => {
  // Umbral parametrizable: tiempo máximo sin reporte antes de marcar NO_REPORTA
  const threshold = Number(process.env.HEARTBEAT_THRESHOLD || 60000);
  const checkInterval = 15_000; // revisar cada 15 segundos

  console.log(
    `[Heartbeat] Watcher iniciado | Umbral: ${threshold / 1000}s | Intervalo: ${checkInterval / 1000}s`
  );

  setInterval(async () => {
    const cutoff = new Date(Date.now() - threshold);

    try {
      // 1. Buscar nodos que deben cambiar a NO_REPORTA (estaban ACTIVE y superaron umbral)
      const nodosAfectados = await Client.find({
        status: "ACTIVE",
        lastSeenAt: { $lt: cutoff },
      }).select("clientId lastSeenAt");

      // 2. Actualizar status en batch (más eficiente que uno a uno)
      await Client.updateMany(
        { clientId: { $in: clientIds } },
        { $set: { status: "NO_REPORTA" } }
      );

      // 3. Generar un Log por cada nodo caído (para auditoría y dashboard)
      const logDocs = nodosAfectados.map((c) => ({
        clientId: c.clientId,
        level: "WARN",
        message: `Nodo marcado NO_REPORTA. Sin reporte desde ${c.lastSeenAt.toISOString()}. Umbral: ${threshold / 1000}s`,
      }));
      await Log.insertMany(logDocs);

      console.warn(
        `[Heartbeat] ⚠️  ${clientIds.length} nodo(s) sin reporte: ${clientIds.join(", ")}`
      );
    } catch (err) {
      console.error("[Heartbeat] Error en watcher [NO_REPORTA]:", err.message);
    }

    // --- NUEVO: Loggear Nodos Activos ---
    try {
      // Buscar nodos vivos
      const nodosVivos = await Client.find({
        status: "ACTIVE",
        lastSeenAt: { $gte: cutoff },
      }).select("clientId lastSeenAt");

      if (nodosVivos.length > 0) {
        const activeLogDocs = nodosVivos.map((c) => ({
          clientId: c.clientId,
          level: "INFO",
          message: `Nodo activo y reportando. Última vista: ${c.lastSeenAt.toISOString()}`,
        }));
        await Log.insertMany(activeLogDocs);
      }
    } catch (err) {
      console.error("[Heartbeat] Error en watcher [ACTIVE]:", err.message);
    }
  }, checkInterval);
};
