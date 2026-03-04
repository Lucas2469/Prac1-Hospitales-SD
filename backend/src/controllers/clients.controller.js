import Client from "../models/Client.js";
import Log from "../models/Log.js";

// ✅ 3.1 Registrar/actualizar cliente
export const registerClient = async (req, res) => {
  const { clientId, ipAddress, region } = req.body;

  if (!clientId || !ipAddress) {
    return res.status(400).json({ message: "clientId e ipAddress son obligatorios" });
  }

  try {
    // Buscar primero si el administrador ya lo ingresó por IP manualmente
    let client = await Client.findOne({ ipAddress });

    if (client) {
      // Si existe por IP, solo actualizamos los campos (respetando el alias original)
      client.lastSeenAt = new Date();
      client.status = "ACTIVE";
      // Actualizamos al clientId real emitido por el socket TCP para que las métricas le lleguen a este mismo documento
      client.clientId = clientId;
      await client.save();
    } else {
      // Búsqueda o creación normal por clientId (cuando se auto-descubre)
      client = await Client.findOneAndUpdate(
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
    }

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

// ✅ 3.4 Actualizar status manualmente (usado por db_bridge.py desde Python)
export const updateStatus = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status } = req.body;

    const validStatuses = ["ACTIVE", "NO_REPORTA"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status inválido. Use: ${validStatuses.join(" | ")}` });
    }

    const updated = await Client.findOneAndUpdate(
      { clientId },
      { $set: { status } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Client not found" });

    // Si se marca como NO_REPORTA, generar log automático en MongoDB
    if (status === "NO_REPORTA") {
      await Log.create({
        clientId,
        level: "WARN",
        message: `Nodo marcado como NO_REPORTA por el monitor de Heartbeat`,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Eliminar cliente (desde el panel admin)
export const deleteClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const deleted = await Client.findOneAndDelete({ clientId });
    if (!deleted) return res.status(404).json({ message: "Cliente no encontrado" });
    // También eliminar su historial de métricas
    const Metric = (await import("../models/Metric.js")).default;
    await Metric.deleteMany({ clientId });
    res.json({ ok: true, deleted: clientId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Añadir cliente manualmente (desde el panel admin)
export const addClientManual = async (req, res) => {
  try {
    const { alias, ipAddress } = req.body;
    if (!alias || !ipAddress) {
      return res.status(400).json({ message: "Alias e IP son obligatorios" });
    }

    // Check si ya existe el nodo con esa IP (por ejemplo, autodescubierto por Python)
    let client = await Client.findOne({ ipAddress });

    if (client) {
      // Actualizamos el alias pero mantenemos el clientId original del socket
      client.alias = alias;
      client.region = "Manual";
      client.status = "ACTIVE";
      client.lastSeenAt = new Date();
      await client.save();
    } else {
      // Usar el alias como clientId (reemplazando espacios x guiones)
      const clientId = alias.trim().replace(/\s+/g, '-');

      client = await Client.findOneAndUpdate(
        { clientId },
        {
          $set: {
            alias,
            ipAddress,
            region: "Manual",
            lastSeenAt: new Date(),
            status: "ACTIVE", // Por defecto activo para que aparezca verde
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json({ ok: true, client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
