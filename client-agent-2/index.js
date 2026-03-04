/**
 * Módulo 2: Agente Cliente CNS
 * Tareas: 2.1 Colector multi-disco | 2.2 Auto-unión | 2.3 Logs | 2.4 Reporte periódico
 * + UI Web en puerto 3001
 */

import dotenv from "dotenv";
import { hostname } from "os";
import { createClient } from "./lib/tcpClient.js";
import { startWebUI, clientState, addIncomingNotification } from "./lib/webServer.js";

dotenv.config();

const SERVER_HOST = process.env.SERVER_HOST || "localhost";
const SERVER_PORT = parseInt(process.env.SERVER_PORT || "5000", 10);
const REPORT_INTERVAL = parseInt(process.env.REPORT_INTERVAL_SECONDS || "30", 10);
const NODE_ALIAS = process.env.NODE_ALIAS || hostname();
const RECONNECT_MS = 5000;

// Compartir config con la UI web
clientState.serverHost = SERVER_HOST;
clientState.serverPort = SERVER_PORT;
clientState.nodeAlias = NODE_ALIAS;

// Arrancar la UI web (puerto 3001)
startWebUI();

function main() {
  const client = createClient({
    host: SERVER_HOST,
    port: SERVER_PORT,
    reportIntervalSec: REPORT_INTERVAL,
    nodeAlias: NODE_ALIAS,

    onConnect: () => {
      clientState.connected = true;
    },

    onDisconnect: () => {
      clientState.connected = false;
      console.warn("[Client] Conexión perdida. Reintentando en", RECONNECT_MS / 1000, "s...");
      setTimeout(tryConnect, RECONNECT_MS);
    },

    onMetricsSent: (disks) => {
      clientState.disks = disks;
      clientState.lastSend = new Date().toISOString();
      clientState.metricsCount = (clientState.metricsCount || 0) + 1;
    },

    onNotification: (msg) => addIncomingNotification(msg),
  });

  function tryConnect() {
    console.log(`[Client] Conectando a ${SERVER_HOST}:${SERVER_PORT} (alias: ${NODE_ALIAS})...`);
    client.connect().catch((err) => {
      clientState.connected = false;
      console.warn("[Client] No se pudo conectar:", err.message);
      setTimeout(tryConnect, RECONNECT_MS);
    });
  }

  process.on("SIGINT", () => { client.disconnect(); process.exit(0); });
  tryConnect();
}

main();
