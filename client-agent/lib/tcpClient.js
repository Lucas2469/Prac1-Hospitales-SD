/**
 * Módulo 2 - Tareas 2.2, 2.4: Cliente TCP
 * Protocolo compatible con backend (Módulo 1 - Jorge): HELLO, DATA, COMMAND, ACK
 */

import { createConnection } from "net";
import { hostname } from "os";
import { networkInterfaces } from "os";
import { getDiskInfo } from "./diskCollector.js";
import { logMessage } from "./logManager.js";
import http from "http"; // Import HTTP for polling


function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

export function createClient(config) {
  const {
    host = "localhost",
    port = 5000,
    reportIntervalSec = 30,
    nodeAlias = hostname(),
    onDisconnect = null,
    onConnect = null,
    onMetricsSent = null,
    onNotification = null,
  } = config;
  let socket = null;
  let reportTimer = null;
  let pollTimer = null; // Notification poll timer
  let isConnected = false;
  let bufferMetrics = [];

  function send(data) {
    if (!socket || !isConnected) return false;
    try {
      socket.write(JSON.stringify(data), "utf8");
      return true;
    } catch (err) {
      console.error("[tcpClient] Error al enviar:", err.message);
      return false;
    }
  }

  async function doAutoJoin() {
    const disks = await getDiskInfo();
    const hello = {
      type: "HELLO",
      node_id: nodeAlias,
      clientInfo: {
        hostname: hostname(),
        ip: getLocalIP(),
        platform: process.platform,
        timestamp: new Date().toISOString(),
      },
      disks: disks,
    };
    return send(hello);
  }

  async function sendMetricsReport() {
    const disks = await getDiskInfo();
    const disk_data = disks.length > 0
      ? {
        totalGB: disks[0].totalGB,
        usedGB: disks[0].usedGB,
        freeGB: disks[0].freeGB,
        usedPercent: disks[0].usedPercent,
        libre: parseFloat(disks[0].freeGB),
        disksFull: disks,
      }
      : { libre: 0, disksFull: [] };

    const data = {
      type: "DATA",
      node_id: nodeAlias,
      disk_data,
      timestamp: new Date().toISOString(),
    };

    // Tarea: Guardar log en un archivo local
    logMessage(`Métricas recolectadas: ${disks.length} disco(s)`, {
      type: "LOCAL_METRICS",
      ...data
    });

    if (isConnected && send(data)) {
      bufferMetrics = [];
      console.log(`[tcpClient] Métricas enviadas (${disks.length} disco/s)`);
      // Notificar a la UI
      if (typeof onMetricsSent === 'function') {
        // Pasar en formato Metric (total/used/free/percent) para la UI web
        onMetricsSent(disks.map(d => ({
          name: d.mountPoint,
          type: d.filesystem,
          total: Number(d.totalGB),
          used: Number(d.usedGB),
          free: Number(d.freeGB),
          percent: Number(d.usedPercent),
        })));
      }
    } else {
      bufferMetrics.push(data);
    }
  }

  function flushBufferedMetrics() {
    while (bufferMetrics.length > 0) send(bufferMetrics.shift());
  }

  function handleIncoming(data) {
    try {
      const msg = typeof data === "string" ? JSON.parse(data) : data;
      if (msg.type === "COMMAND") {
        const message = `${msg.action || ""} -> ${msg.value || ""}`.trim();
        logMessage(message, { type: "COMMAND", action: msg.action, value: msg.value });
        send({ type: "ACK", node_id: nodeAlias, status: "Comando ejecutado con éxito" });
        // Mostrar en la UI web
        if (typeof onNotification === 'function') onNotification(message);
      } else if (msg.type === "NOTIFICATION") {
        const message = msg.message || "Notificación recibida";
        logMessage(message, { type: "NOTIFICATION", receivedAt: msg.sentAt });
        if (typeof onNotification === 'function') onNotification(message);
      }
    } catch (err) {
      console.warn("[tcpClient] Mensaje no parseable:", data?.slice?.(0, 80));
    }
  }

  // --- NUEVO: Polling de Notificaciones Pendientes desde BD ---
  function pollPendingNotifications() {
    // Usamos el API port 4000 (Node.js REST backend)
    const options = {
      hostname: host,
      port: 4000,
      path: `/api/notifications/pending/${nodeAlias}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(responseBody);
            if (data.ok && data.notifications && data.notifications.length > 0) {
              // Iteramos sobre las notificaciones nuevas
              for (const notif of data.notifications) {
                console.log(`[tcpClient] 📥 Notificación descargada de BD: ${notif.message}`);
                handleIncoming(notif);
              }
            }
          } catch (e) {
            console.warn("[tcpClient] Error parseando JSON del Polling:", e.message);
          }
        }
      });
    });

    req.on('error', (e) => {
      // Silenciar si el backend REST está apagado momentáneamente
      // console.warn("[tcpClient] No se pudo hacer polling a REST API:", e.message);
    });

    req.end();
  }

  function connect() {
    return new Promise((resolve, reject) => {
      socket = createConnection({ host, port }, async () => {
        isConnected = true;
        console.log(`[tcpClient] Conectado a ${host}:${port}`);
        if (typeof onConnect === 'function') onConnect();
        await doAutoJoin();
        flushBufferedMetrics();

        reportTimer = setInterval(sendMetricsReport, reportIntervalSec * 1000);
        pollTimer = setInterval(pollPendingNotifications, 15000); // Poll every 15s

        await sendMetricsReport();
        resolve();
      });

      let buffer = "";
      socket.on("data", (chunk) => {
        buffer += chunk.toString();
        try {
          const msg = JSON.parse(buffer);
          buffer = "";
          handleIncoming(msg);
        } catch (e) {
          if (buffer.length > 65536) buffer = "";
        }
      });

      socket.on("error", (err) => {
        isConnected = false;
        reject(err);
      });

      socket.on("close", (hadError) => {
        isConnected = false;
        if (reportTimer) clearInterval(reportTimer);
        if (pollTimer) clearInterval(pollTimer);
        reportTimer = null;
        pollTimer = null;
        if (typeof onDisconnect === "function") onDisconnect(hadError);
      });
    });
  }

  function disconnect() {
    if (reportTimer) clearInterval(reportTimer);
    if (pollTimer) clearInterval(pollTimer);
    if (socket) socket.destroy();
    socket = null;
    reportTimer = null;
    pollTimer = null;
    isConnected = false;
  }

  return { connect, disconnect, sendMetrics: sendMetricsReport, isConnected: () => isConnected };
}
