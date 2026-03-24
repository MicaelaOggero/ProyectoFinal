import { Router } from "express";
import {
  getWeeklyProjectMetricsController,
  getWeeklyDeveloperMetricsController,
  getFinalProjectReportController,
  getFinalProjectReportPdfController,
  createFinalProjectReportController,
} from "./report.controller.js";

const router = Router();

router.get("/weekly/project/:projectId", getWeeklyProjectMetricsController);
router.get("/weekly/developers/:projectId", getWeeklyDeveloperMetricsController);
router.post("/final/:projectId", createFinalProjectReportController);
router.get("/final/:projectId", getFinalProjectReportController);
router.get("/final/:projectId/pdf", getFinalProjectReportPdfController);

export default router;
