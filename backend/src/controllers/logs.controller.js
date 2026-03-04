import Log from "../models/Log.js";

/**
 * POST /api/logs/ingest
 * Permite que el cliente mande logs acumulados cuando vuelva conexión
 */
export const ingestLogs = async (req, res) => {
  const { clientId, logs } = req.body;

  if (!clientId || !Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ message: "clientId y logs[] (>=1) son obligatorios" });
  }

  // logs: [{timestamp, level, message, meta}]
  const docs = logs.map(l => ({
    clientId,
    timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
    level: l.level || "INFO",
    message: l.message || "",
    meta: l.meta || {}
  })).filter(x => x.message);

  const saved = await Log.insertMany(docs);
  res.json({ inserted: saved.length });
};

/**
 * GET /api/logs?clientId=reg-01&limit=50
 */
export const getLogs = async (req, res) => {
  const { clientId, limit = 50 } = req.query;
  if (!clientId) return res.status(400).json({ message: "clientId es obligatorio" });

  const lim = Math.min(Number(limit) || 50, 500);
  const rows = await Log.find({ clientId }).sort({ timestamp: -1 }).limit(lim);
  res.json(rows);
};

/**
 * GET /api/logs/all?limit=100
 * Global endpoint for Server Logs Dashboard View
 */
export const getAllLogs = async (req, res) => {
  const { limit = 100 } = req.query;
  const lim = Math.min(Number(limit) || 100, 1000);

  try {
    const rows = await Log.find({}).sort({ timestamp: -1 }).limit(lim);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};