import Client from "../models/Client.js";

export const startHeartbeatWatcher = () => {
  const threshold = Number(process.env.HEARTBEAT_THRESHOLD || 60000);

  setInterval(async () => {
    const cutoff = new Date(Date.now() - threshold);

    await Client.updateMany(
      { lastSeenAt: { $lt: cutoff } },
      { $set: { status: "NO_REPORTA" } }
    );
  }, 15000);
};