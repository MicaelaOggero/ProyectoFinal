import { createFeedback, findFeedbackByUser } from "./performanceFeedback.dao.js";

export async function addFeedback(feedbackData) {
  // Acá podrías meter validaciones extras:
  // - verificar que el proyecto esté finalizado
  // - verificar que el admin esté autorizado a evaluar
  return await createFeedback(feedbackData);
}

export async function getFeedbackByUser(userId) {
  return await findFeedbackByUser(userId);
}
