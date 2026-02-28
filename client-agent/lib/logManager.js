/**
 * Módulo 2 - Tarea 2.3: Gestión de Logs Locales
 * Guarda cada mensaje recibido del servidor en un archivo físico .log
 */

import { appendFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = join(__dirname, "..", "logs");

function ensureLogsDir() {
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getLogFileName() {
  const dateStr = new Date().toISOString().slice(0, 10);
  return `client-${dateStr}.log`;
}

/**
 * Registra un mensaje recibido del servidor en el archivo .log
 * @param {string} message - Mensaje recibido (ej: "Reinicie servicio")
 * @param {Object} metadata - Metadatos opcionales
 */
export function logMessage(message, metadata = {}) {
  try {
    ensureLogsDir();
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, ...metadata };
    const line = `[${timestamp}] ${JSON.stringify(logEntry)}\n`;
    const logPath = join(LOGS_DIR, getLogFileName());
    appendFileSync(logPath, line, "utf8");
    console.log(`[logManager] Mensaje guardado en ${getLogFileName()}`);
  } catch (err) {
    console.error("[logManager] Error al guardar log:", err.message);
  }
}
