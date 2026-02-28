import express from "express";
import { registerClient, getClients, setAlias, heartbeat } from "../controllers/clients.controller.js";

const router = express.Router();

router.post("/register", registerClient);
router.get("/", getClients);
router.patch("/:clientId/alias", setAlias);
router.post("/:clientId/heartbeat", heartbeat);

export default router;