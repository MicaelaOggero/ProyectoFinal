import {
  getWeeklyProjectMetrics,
  getWeeklyDeveloperMetrics,
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
