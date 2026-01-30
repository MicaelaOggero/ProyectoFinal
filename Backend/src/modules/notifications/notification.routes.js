// routes/notifications.routes.js (o tasklog.routes.js)
import express from "express";
import { calificarCalidadDesdeNotificacionController } from "../notifications/notification.controller.js";

const router = express.Router();

// Admin califica calidad desde una notificación
router.patch("/notificaciones/:notificationId/calificar", calificarCalidadDesdeNotificacionController);

export default router;
