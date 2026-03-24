import { Router } from "express";
import {
  getWeeklyProjectMetricsController,
  getWeeklyDeveloperMetricsController,
} from "./report.controller.js";

const router = Router();

router.get("/weekly/project/:projectId", getWeeklyProjectMetricsController);
router.get("/weekly/developers/:projectId", getWeeklyDeveloperMetricsController);

export default router;
