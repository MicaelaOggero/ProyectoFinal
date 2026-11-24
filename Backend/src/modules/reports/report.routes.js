import { Router } from "express";
import { authAdmin } from '../../middlewares/auth.js';
import { authorizeCurrentProject } from '../companies/tenant.auth.js';
import {
  getWeeklyProjectMetricsController,
  getWeeklyDeveloperMetricsController,
  getFinalProjectReportController,
  getFinalProjectReportPdfController,
  createFinalProjectReportController,
  getWeeklyTasksReportController,
} from "./report.controller.js";

const router = Router();
const manageProject = [authAdmin, authorizeCurrentProject('projectId', { adminOnly: true })];

router.get("/weekly/project/:projectId", ...manageProject, getWeeklyProjectMetricsController);
router.get("/weekly/developers/:projectId", ...manageProject, getWeeklyDeveloperMetricsController);
router.get("/weekly/tasks/:projectId", ...manageProject, getWeeklyTasksReportController);
router.post("/final/:projectId", ...manageProject, createFinalProjectReportController);
router.get("/final/:projectId", ...manageProject, getFinalProjectReportController);
router.get("/final/:projectId/pdf", ...manageProject, getFinalProjectReportPdfController);

export default router;
