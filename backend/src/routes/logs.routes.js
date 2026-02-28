import express from "express";
import { ingestLogs, getLogs } from "../controllers/logs.controller.js";

const router = express.Router();

router.post("/ingest", ingestLogs);
router.get("/", getLogs);

export default router;