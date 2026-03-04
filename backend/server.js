import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import net from "net";

import clientsRoutes from "./src/routes/clients.routes.js";
import metricsRoutes from "./src/routes/metrics.routes.js";
import logsRoutes from "./src/routes/logs.routes.js";
import notificationsRoutes from "./src/routes/notifications.routes.js";

import { startHeartbeatWatcher } from "./src/services/heartbeat.service.js";
import { registerSocket, unregisterSocket } from "./src/services/socket.registry.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Conexión Mongo
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado correctamente");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
};

await connectDB();

// ✅ Rutas REST
app.get("/", (req, res) => res.send("Backend Módulo 3 OK ✅"));
app.use("/api/clients", clientsRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/notifications", notificationsRoutes); // Tarea 3.3

// ✅ Heartbeat watcher (Tarea 3.4)
startHeartbeatWatcher();

// ✅ Servidor TCP Node.js (puerto TCP_PORT, default 5001)
// Complementa al servidor Python (5000). Los clientes que conecten aquí
// quedan registrados en socket.registry para recibir notificaciones via REST.
const TCP_PORT = Number(process.env.TCP_PORT || 5001);

const tcpServer = net.createServer((socket) => {
  const addr = `${socket.remoteAddress}:${socket.remotePort}`;
  let clientId = null;
  let buffer = "";

  console.log(`[TCP] Nueva conexión: ${addr}`);

  socket.on("data", (chunk) => {
    // Acumular en buffer hasta encontrar delimitador \n (compatibilidad con Python)
    buffer += chunk.toString("utf-8");
    const lines = buffer.split("\n");
    buffer = lines.pop(); // último fragmento incompleto

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const type = msg.type;
        const id = msg.node_id || msg.clientId;

        if (type === "HELLO" && id) {
          // Tarea 3.1: registrar socket en memoria para notificaciones
          clientId = id;
          registerSocket(clientId, socket);
          socket.write(JSON.stringify({ type: "ACK", status: "Registrado en Node.js TCP" }) + "\n");
        } else if (type === "DATA" && clientId) {
          // Tarea 3.1: heartbeat implícito (actualiza lastSeenAt via REST interna)
          console.log(`[TCP] DATA recibido de ${clientId}`);
        }
      } catch {
        console.warn(`[TCP] JSON inválido de ${addr}:`, line);
      }
    }
  });

  socket.on("close", () => {
    if (clientId) unregisterSocket(clientId);
    console.log(`[TCP] Conexión cerrada: ${addr}`);
  });

  socket.on("error", (err) => {
    console.error(`[TCP] Error en socket ${addr}:`, err.message);
  });
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`🔌 Servidor TCP Node.js escuchando en puerto ${TCP_PORT}`);
});

// ✅ Servidor HTTP REST
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor REST corriendo en http://localhost:${PORT}`));
