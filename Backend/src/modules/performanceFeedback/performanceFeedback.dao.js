import PerformanceFeedback from "./performanceFeedback.model.js";

export async function createFeedback(data) {
  return await PerformanceFeedback.create(data);
}

export async function findFeedbackByUser(userId) {
  return await PerformanceFeedback.find({ desarrollador: userId })
    .populate("proyecto")
    .populate("administrador", "nombre email");
}
