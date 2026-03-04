import express from "express";
import { registerClient, getClients, setAlias, heartbeat, updateStatus, deleteClient, addClientManual } from "../controllers/clients.controller.js";

const router = express.Router();

router.post("/register", registerClient);
router.post("/add", addClientManual);
router.get("/", getClients);
router.patch("/:clientId/alias", setAlias);
router.post("/:clientId/heartbeat", heartbeat);
router.patch("/:clientId/status", updateStatus);
router.delete("/:clientId", deleteClient);

export default router;
