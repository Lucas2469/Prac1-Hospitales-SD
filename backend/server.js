import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import clientsRoutes from "./src/routes/clients.routes.js";
import metricsRoutes from "./src/routes/metrics.routes.js";
import logsRoutes from "./src/routes/logs.routes.js";

import { startHeartbeatWatcher } from "./src/services/heartbeat.service.js";

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

// ✅ Rutas
app.get("/", (req, res) => res.send("Backend Módulo 3 OK ✅"));
app.use("/api/clients", clientsRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/logs", logsRoutes);

// ✅ Heartbeat watcher
startHeartbeatWatcher();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));