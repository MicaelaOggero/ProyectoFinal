import { addFeedback, getFeedbackByUser } from "./performanceFeedback.service.js";

export async function crearFeedback(req, res) {
  try {
    const feedback = await addFeedback(req.body);
    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function listarFeedbackPorUsuario(req, res) {
  try {
    const { userId } = req.params;
    const feedbacks = await getFeedbackByUser(userId);
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

import PerformanceFeedback from "../performanceFeedback/performanceFeedback.model.js";

export const crearFeedbackMasivoController = async (req, res) => {
  try {
    const feedbacks = req.body.feedbacks;

    if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Se requiere un array de feedbacks no vacío",
      });
    }

    const result = await PerformanceFeedback.insertMany(feedbacks);

    return res.status(201).json({
      status: "success",
      message: `${result.length} feedback(s) creados correctamente`,
      data: result,
    });
  } catch (error) {
    console.error("Error creando feedbacks masivos:", error);
    return res.status(500).json({
      status: "error",
      message: "Error interno al crear feedbacks masivos",
      details: error.message,
    });
  }
};
