/**
 * Módulo 2: Agente Cliente y Recolección Multi-disco
 * Tareas: 2.1 Colector | 2.2 Auto-unión | 2.3 Logs | 2.4 Reporte periódico
 */

import dotenv from "dotenv";
import { hostname } from "os";
import { createClient } from "./lib/tcpClient.js";

dotenv.config();

const SERVER_HOST = process.env.SERVER_HOST || "localhost";
const SERVER_PORT = parseInt(process.env.SERVER_PORT || "5000", 10);
const REPORT_INTERVAL_SEC = parseInt(process.env.REPORT_INTERVAL_SECONDS || "30", 10);
const NODE_ALIAS = process.env.NODE_ALIAS || hostname();
const RECONNECT_MS = 5000;

function main() {
  const client = createClient({
    host: SERVER_HOST,
    port: SERVER_PORT,
    reportIntervalSec: REPORT_INTERVAL_SEC,
    nodeAlias: NODE_ALIAS,
    onDisconnect: () => {
      console.warn("[Client] Conexión perdida. Reintentando en", RECONNECT_MS / 1000, "s...");
      setTimeout(tryConnect, RECONNECT_MS);
    },
  });

  function tryConnect() {
    console.log(`[Client] Conectando a ${SERVER_HOST}:${SERVER_PORT} (alias: ${NODE_ALIAS})...`);
    client.connect().catch((err) => {
      console.warn("[Client] No se pudo conectar:", err.message);
      setTimeout(tryConnect, RECONNECT_MS);
    });
  }

  process.on("SIGINT", () => {
    client.disconnect();
    process.exit(0);
  });

  tryConnect();
}

main();
