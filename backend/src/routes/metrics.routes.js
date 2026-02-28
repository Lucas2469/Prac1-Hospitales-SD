import express from "express";
import { reportMetrics, getHistory, getClusterSummary } from "../controllers/metrics.controller.js";

const router = express.Router();

router.post("/report", reportMetrics);
router.get("/history", getHistory);
router.get("/cluster-summary", getClusterSummary);

export default router;