// routes/notifications.routes.js (o tasklog.routes.js)
import express from "express";
import { calificarCalidadDesdeNotificacionController } from "../notifications/notification.controller.js";
import { authAdmin } from "../../middlewares/auth.js";

const router = express.Router();

// Admin califica calidad desde una notificación
router.patch("/:notificationId/calificar", authAdmin,calificarCalidadDesdeNotificacionController);

export default router;
