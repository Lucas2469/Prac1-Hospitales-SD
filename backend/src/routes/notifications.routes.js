import express from "express";
import {
    sendNotification,
    listActiveSockets,
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

export default router;
