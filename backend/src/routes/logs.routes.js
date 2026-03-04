import express from "express";
import { ingestLogs, getLogs, getAllLogs } from "../controllers/logs.controller.js";

const router = express.Router();

router.post("/ingest", ingestLogs);
router.get("/all", getAllLogs);
router.get("/", getLogs);

export default router;