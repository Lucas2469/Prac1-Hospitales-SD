import express from "express";
import {
    sendNotification,
    listActiveSockets,
    getPendingNotifications
} from "../controllers/notifications.controller.js";

const router = express.Router();

/**
 * POST /api/notifications/send
 * Body: { clientId, message, type? }
 * Envía un mensaje al cliente via su socket TCP activo (Tarea 3.3)
 */
router.post("/send", sendNotification);

/**
 * GET /api/notifications/active-sockets
 * Lista los nodos con socket TCP activo en Node.js
 */
router.get("/active-sockets", listActiveSockets);

/**
 * GET /api/notifications/pending/:clientId
 * Retorna (y marca como leídas) las alertas pendientes en base de datos
 */
router.get("/pending/:clientId", getPendingNotifications);

export default router;
