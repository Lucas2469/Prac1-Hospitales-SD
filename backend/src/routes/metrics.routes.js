import express from "express";
import { reportMetrics, getHistory, getClusterSummary, getLatest, getClusterHistory } from "../controllers/metrics.controller.js";

const router = express.Router();

router.post("/report", reportMetrics);
router.get("/history", getHistory);
router.get("/cluster-summary", getClusterSummary);
router.get("/cluster-history", getClusterHistory);
router.get("/:clientId/latest", getLatest);

export default router;
