/**
 * Módulo 2 - Tareas 2.2, 2.4: Cliente TCP
 * Protocolo compatible con backend (Módulo 1 - Jorge): HELLO, DATA, COMMAND, ACK
 */

import { createConnection } from "net";
import { hostname } from "os";
import { networkInterfaces } from "os";
import { getDiskInfo } from "./diskCollector.js";
import { logMessage } from "./logManager.js";

function getLocalIP() {
  return "192.168.1.150"; // IP simulada fija para el cliente 2
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
        logMessage(msg.message, { type: "NOTIFICATION" });
        send({ type: "ACK", node_id: nodeAlias, status: "Notificación recibida" });
        if (typeof onNotification === 'function') onNotification(msg.message);
      }
    } catch (err) {
      console.warn("[tcpClient] Mensaje no parseable:", data?.slice?.(0, 80));
    }
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
        reportTimer = null;
        if (typeof onDisconnect === "function") onDisconnect(hadError);
      });
    });
  }

  function disconnect() {
    if (reportTimer) clearInterval(reportTimer);
    if (socket) socket.destroy();
    socket = null;
    reportTimer = null;
    isConnected = false;
  }

  return { connect, disconnect, sendMetrics: sendMetricsReport, isConnected: () => isConnected };
}
