import Metric from "../models/Metric.js";
import Client from "../models/Client.js";
import Notification from "../models/Notification.js";

/**
 * POST /api/metrics/report
 * Guarda historial de métricas (OBLIGATORIO por enunciado)
 * También actualiza lastSeenAt/status del cliente (puede reemplazar heartbeat)
 */
export const reportMetrics = async (req, res) => {
  const { clientId, disks, timestamp } = req.body;

  if (!clientId || !Array.isArray(disks) || disks.length === 0) {
    return res.status(400).json({ message: "clientId y disks[] (>=1) son obligatorios" });
  }

  // Normalizar timestamp: si no viene, usamos servidor (UTC)
  const ts = timestamp ? new Date(timestamp) : new Date();

  // Validar sincronización de tiempo
  if (timestamp) {
    const timeDiffMs = Math.abs(new Date().getTime() - ts.getTime());
    if (timeDiffMs > 60000) {
      // Diferencia mayor a 1 minuto: Enviar notificación al agente
      const message = "Verifique su configuracion (Hora desincronizada)";
      const notifType = "NOTIFICATION";
      const sentAt = new Date().toISOString();

      // 1. Guardar en Base de Datos para el Polling (Nodos Remotos / Firewall HTTP)
      try {
        await Notification.create({
          clientId,
          message,
          type: notifType,
          sentAt,
          read: false
        });
      } catch (dbError) {
        console.error(`[TimeSync] Error guardando notificación en DB para ${clientId}:`, dbError.message);
      }

      // 2. Intentar Push por TCP/Python (Nodos Locales)
      try {
        await fetch("http://127.0.0.1:5002/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Enviar también body JSON
          body: JSON.stringify({ clientId, type: notifType, message, sentAt })
        });
        console.warn(`[TimeSync] ⏰ Reloj desincronizado en ${clientId}. Notificación generada.`);
      } catch (err) {
        console.error(`[TimeSync] Error al notificar a Python (${clientId}):`, err.message);
      }
    }
  }

  try {
    // 1) Guardar historial
    const metric = await Metric.create({
      clientId,
      timestamp: ts,
      statusSnapshot: "ACTIVE",
      disks
    });

    // 2) Actualizar cliente como vivo
    await Client.findOneAndUpdate(
      { clientId },
      { $set: { lastSeenAt: new Date(), status: "ACTIVE" } },
      { upsert: true }
    );

    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/metrics/:clientId/latest
 * Devuelve el último snapshot completo (con todos los discos) de un cliente.
 * Usado por el frontend para mostrar datos reales en DiskDetail.
 */
export const getLatest = async (req, res) => {
  const { clientId } = req.params;
  if (!clientId) return res.status(400).json({ message: "clientId es obligatorio" });

  try {
    const metric = await Metric.findOne({ clientId }).sort({ timestamp: -1 });
    if (!metric) return res.status(404).json({ message: "Sin métricas para ese cliente" });
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/metrics/history?clientId=reg-01&limit=50
 * Devuelve histórico para gráficas (por cliente)
 */
export const getHistory = async (req, res) => {
  const { clientId, limit = 50 } = req.query;
  if (!clientId) return res.status(400).json({ message: "clientId es obligatorio" });

  const lim = Math.min(Number(limit) || 50, 500);

  const rows = await Metric.find({ clientId }).sort({ timestamp: -1 }).limit(lim);
  res.json(rows);
};

/**
 * GET /api/metrics/cluster-summary
 * Consolida (Σ total/used/free y % global) usando el último reporte por cliente
 */
export const getClusterSummary = async (req, res) => {
  try {
    // Tomar el último reporte por clientId
    const latest = await Metric.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$clientId",
          last: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$last" } }
    ]);

    let total = 0, used = 0, free = 0;
    const perNode = [];

    for (const m of latest) {
      if (!m.disks || m.disks.length === 0) continue;

      let nodeTotal = 0, nodeUsed = 0, nodeFree = 0;

      for (const d of m.disks) {
        nodeTotal += d.total;
        nodeUsed += d.used;
        nodeFree += d.free;
      }

      total += nodeTotal;
      used += nodeUsed;
      free += nodeFree;

      perNode.push({
        clientId: m.clientId,
        timestamp: m.timestamp,
        disk: { total: nodeTotal, used: nodeUsed, free: nodeFree },
        statusSnapshot: m.statusSnapshot
      });
    }

    const percentGlobal = total > 0 ? Number(((used / total) * 100).toFixed(2)) : 0;

    res.json({
      nodesCount: perNode.length,
      total,
      used,
      free,
      percentGlobal,
      perNode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/metrics/cluster-history
 * Agrupa todas las métricas de todos los nodos por hora/día y devuelve
 * la suma de Total, Usado y Libre para gráfica lineal en el frontend.
 */
export const getClusterHistory = async (req, res) => {
  try {
    // Definimos el rango de tiempo (ej. últimos 14 días para una buena gráfica)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const history = await Metric.aggregate([
      // 1. Filtrar registros recientes
      { $match: { timestamp: { $gte: cutoffDate } } },

      // 2. Sumar el espacio de todos los discos del nodo
      {
        $addFields: {
          nodeTotal: { $sum: "$disks.total" },
          nodeUsed: { $sum: "$disks.used" },
          nodeFree: { $sum: "$disks.free" }
        }
      },

      // 3. Agrupar por hora exacta + NodeID, para obtener solo 1 lectura máxima por hora por cada nodo
      {
        $group: {
          _id: {
            clientId: "$clientId",
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
            hour: { $hour: "$timestamp" }
          },
          // Tomar el promedio o máximo del total de todo el nodo en esa hora
          total: { $avg: "$nodeTotal" },
          used: { $avg: "$nodeUsed" },
          free: { $avg: "$nodeFree" }
        }
      },

      // 4. Ahora agrupar esos representantes horarios a nivel de CLUSTER
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
            hour: "$_id.hour"
          },
          clusterTotal: { $sum: "$total" },
          clusterUsed: { $sum: "$used" },
          clusterFree: { $sum: "$free" }
        }
      },

      // 5. Ordenar cronológicamente
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },

      // 6. Formatear la salida para Recharts
      {
        $project: {
          _id: 0,
          // Un string del tipo "DD/MM HH:00" usando concat
          time: {
            $concat: [
              { $toString: "$_id.day" }, "/",
              { $toString: "$_id.month" }, " ",
              { $toString: "$_id.hour" }, ":00"
            ]
          },
          totalSpace: { $round: ["$clusterTotal", 1] },
          usedSpace: { $round: ["$clusterUsed", 1] },
          freeSpace: { $round: ["$clusterFree", 1] }
        }
      }
    ]);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};