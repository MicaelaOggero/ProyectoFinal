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
