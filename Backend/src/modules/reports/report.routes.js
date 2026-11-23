import { Router } from "express";
import {
  getWeeklyProjectMetricsController,
  getWeeklyDeveloperMetricsController,
  getFinalProjectReportController,
  getFinalProjectReportPdfController,
  createFinalProjectReportController,
  getWeeklyTasksReportController,
} from "./report.controller.js";

const router = Router();

router.get("/weekly/project/:projectId", getWeeklyProjectMetricsController);
router.get("/weekly/developers/:projectId", getWeeklyDeveloperMetricsController);
router.get("/weekly/tasks/:projectId", getWeeklyTasksReportController);
router.post("/final/:projectId", createFinalProjectReportController);
router.get("/final/:projectId", getFinalProjectReportController);
router.get("/final/:projectId/pdf", getFinalProjectReportPdfController);

export default router;
