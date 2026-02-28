import Metric from "../models/Metric.js";
import Client from "../models/Client.js";

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
      // Para esta práctica: “solo primer disco”
      const d = (m.disks && m.disks[0]) ? m.disks[0] : null;
      if (!d) continue;

      total += d.total;
      used += d.used;
      free += d.free;

      perNode.push({
        clientId: m.clientId,
        timestamp: m.timestamp,
        disk: d,
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