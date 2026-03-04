/**
 * Servidor web del cliente CNS
 * Sirve la UI en el puerto 3001 y expone un API de estado interno.
 * Se integra con tcpClient para compartir el estado en tiempo real.
 */

import { createServer } from "http";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { networkInterfaces } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.UI_PORT || "3001", 10);

// Obtener IP LAN real
function getLocalIp() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // IPv4 y no loopback (127.0.0.1)
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return "127.0.0.1";
}

// Estado compartido (modificado por el cliente TCP)
export const clientState = {
    connected: false,
    localIp: getLocalIp(),
    serverHost: "—",
    serverPort: "—",
    nodeAlias: "—",
    lastSend: null,
    disks: [],
    notifications: [],   // notificaciones recibidas del admin
    metricsCount: 0,
};

/** Añade una notificación recibida del admin */
export function addIncomingNotification(msg) {
    clientState.notifications.unshift({
        id: Date.now(),
        message: msg,
        receivedAt: new Date().toISOString(),
    });
    // Guardar solo las últimas 50
    if (clientState.notifications.length > 50) clientState.notifications.pop();
}

export function startWebUI() {
    const html = readFileSync(join(__dirname, "..", "public", "index.html"), "utf8");

    const server = createServer((req, res) => {
        if (req.url === "/api/status") {
            res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
            res.end(JSON.stringify(clientState));
            return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
    });

    server.listen(PORT, () => {
        console.log(`\n🌐 [ClientUI] Interfaz web disponible en: http://localhost:${PORT}\n`);
    });
}
