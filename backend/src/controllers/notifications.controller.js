/**
 * notifications.controller.js – Tarea 3.3: API de Notificaciones TCP
 *
 * Endpoint: POST /api/notifications/send
 * Recibe { clientId, message } y envía la notificación al cliente
 * via su socket TCP activo usando el socket.registry.
 *
 * Si el cliente no está conectado via TCP local, intenta fallback
 * al servidor Python (puerto 5000) via HTTP de control.
 */

import { sendToClient, getActiveClients } from "../services/socket.registry.js";
import fetch from "node-fetch";
import Notification from "../models/Notification.js";

/**
 * POST /api/notifications/send
 * Body: { clientId: string, message: string, type?: string }
 */
export const sendNotification = async (req, res) => {
    const { clientId, message, type = "NOTIFICATION" } = req.body;

    if (!clientId || !message) {
        return res.status(400).json({
            ok: false,
            error: "clientId y message son obligatorios",
        });
    }

    // Construir payload de notificación (formato compatible con test_client.py)
    const payload = {
        type,
        message,
        sentAt: new Date().toISOString(),
    };

    // 1. Guardar siempre en Base de Datos por si falla el Push TCP (Fallback)
    try {
        await Notification.create({
            clientId,
            message,
            type,
            sentAt: payload.sentAt,
            read: false
        });
    } catch (dbError) {
        console.error("[Notifications] Error guardando notificación en DB:", dbError.message);
    }

    // 2. Intentar enviar via socket registry en memoria
    const result = sendToClient(clientId, payload);

    if (result.sent) {
        return res.json({
            ok: true,
            clientId,
            message: "Notificación enviada exitosamente via TCP",
            payload,
        });
    }

    // El cliente no tiene socket en Node.js → intentamos fallback a Servidor Python (puerto 5002)
    try {
        const pyRes = await fetch("http://127.0.0.1:5002/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, message, type, sentAt: payload.sentAt })
        });

        const pyData = await pyRes.json();
        if (pyRes.ok && pyData.ok) {
            return res.json({
                ok: true,
                clientId,
                message: "Notificación enviada exitosamente via TCP (Python)",
                payload,
            });
        }
    } catch (e) {
        console.warn("[Notifications] Fallback a Python falló:", e.message);
    }

    // Respondemos 404 con información útil para el administrador
    return res.status(404).json({
        ok: false,
        clientId,
        reason: result.reason,
        activeClients: getActiveClients(),
        hint: "El nodo puede estar conectado al servidor TCP Python (puerto 5000), pero falló el envío.",
    });
};

/**
 * GET /api/notifications/active-sockets
 * Lista los clientIds con socket TCP activo en Node.js
 */
export const listActiveSockets = (_req, res) => {
    const clients = getActiveClients();
    res.json({ count: clients.length, clients });
};

/**
 * GET /api/notifications/pending/:clientId
 * Retorna las notificaciones no leídas de un cliente y las marca como leídas
 */
export const getPendingNotifications = async (req, res) => {
    const { clientId } = req.params;

    if (!clientId) {
        return res.status(400).json({ ok: false, error: "clientId es obligatorio" });
    }

    try {
        // Buscar no leídas
        const pending = await Notification.find({ clientId, read: false }).sort({ createdAt: 1 });

        if (pending.length > 0) {
            // Marcar como leídas
            const ids = pending.map(p => p._id);
            await Notification.updateMany({ _id: { $in: ids } }, { $set: { read: true } });
        }

        res.json({ ok: true, count: pending.length, notifications: pending });
    } catch (error) {
        console.error("[Notifications] Error obteniendo pendientes:", error.message);
        res.status(500).json({ ok: false, error: "Error interno del servidor" });
    }
};
