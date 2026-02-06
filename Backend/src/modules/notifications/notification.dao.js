import Notification from "./notification.model.js";

export const findNotificationsByUserDAO = async (userId) => {
  return await Notification.find({ receptor: userId })
    .populate("proyecto", "nombre estado")
    .populate("tarea", "descripcion")
    .populate("taskLog")
    .populate("emisor", "nombre email")
    .sort({ creadaEn: -1 });
};
