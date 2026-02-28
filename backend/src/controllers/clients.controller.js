import Client from "../models/Client.js";

// ✅ 3.1 Registrar/actualizar cliente
export const registerClient = async (req, res) => {
  const { clientId, ipAddress, region } = req.body;

  if (!clientId || !ipAddress) {
    return res.status(400).json({ message: "clientId e ipAddress son obligatorios" });
  }

  try {
    const client = await Client.findOneAndUpdate(
      { clientId },
      {
        $set: {
          ipAddress,
          region: region ?? "",
          lastSeenAt: new Date(),
          status: "ACTIVE",
        },
      },
      { upsert: true, new: true }
    );

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Listar clientes (ESTE ES EL QUE TE FALTA)
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ 3.2 Asignar alias
export const setAlias = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { alias } = req.body;

    const updated = await Client.findOneAndUpdate(
      { clientId },
      { $set: { alias } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Client not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ 3.4 Heartbeat
export const heartbeat = async (req, res) => {
  try {
    const { clientId } = req.params;

    const updated = await Client.findOneAndUpdate(
      { clientId },
      { $set: { lastSeenAt: new Date(), status: "ACTIVE" } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Client not found" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};