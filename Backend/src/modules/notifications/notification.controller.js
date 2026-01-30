// controllers/notifications.controller.js
import { calificarCalidadDesdeNotificacionService } from "../notifications/notification.service.js";

export const calificarCalidadDesdeNotificacionController = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { puntuacionCalidad } = req.body;

    // ✅ asumo que tenés middleware auth que setea req.user._id
    const adminId = req.user?._id || req.body.adminId; // fallback si no tenés auth armado

    const resultado = await calificarCalidadDesdeNotificacionService({
      notificationId,
      adminId,
      puntuacionCalidad,
    });

    return res.status(200).json({
      ok: true,
      message: "Calificación guardada correctamente.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error en calificarCalidadDesdeNotificacionController:", error);
    return res.status(400).json({
      ok: false,
      message: "Error al calificar la tarea.",
      error: error.message,
    });
  }
};
