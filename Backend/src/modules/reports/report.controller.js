import {
  getWeeklyProjectMetrics,
  getWeeklyDeveloperMetrics,
  getFinalProjectReport,
  getFinalProjectReportPdf,
  saveProjectFinalReport,
  getWeeklyTasksReport,
} from "./report.service.js";

export async function getWeeklyProjectMetricsController(req, res) {
  try {
    const { projectId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({
        error: "weekStart y weekEnd son requeridos en query"
      });
    }

    const result = await getWeeklyProjectMetrics({ projectId, weekStart, weekEnd });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getWeeklyDeveloperMetricsController(req, res) {
  try {
    const { projectId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({
        error: "weekStart y weekEnd son requeridos en query"
      });
    }

    const result = await getWeeklyDeveloperMetrics({ projectId, weekStart, weekEnd });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getFinalProjectReportController(req, res) {
  try {
    const { projectId } = req.params;
    const result = await getFinalProjectReport(projectId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}

export async function getFinalProjectReportPdfController(req, res) {
  try {
    const { projectId } = req.params;
    const pdfBuffer = await getFinalProjectReportPdf(projectId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="final-report-${projectId}.pdf"`
    );

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
}

export async function createFinalProjectReportController(req, res) {
  try {
    const { projectId } = req.params;
    const result = await saveProjectFinalReport(projectId);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getWeeklyTasksReportController(req, res) {
  try {
    const { projectId } = req.params;
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({
        error: "weekStart y weekEnd son requeridos en query"
      });
    }

    const result = await getWeeklyTasksReport({ projectId, weekStart, weekEnd });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
