// routes/notifications.routes.js (o tasklog.routes.js)
import express from "express";
import { calificarCalidadDesdeNotificacionController, obtenerNotificacionesController } from "../notifications/notification.controller.js";
import { authAdmin, auth } from "../../middlewares/auth.js";

const router = express.Router();

// Obtener notificaciones 
router.get("/", auth, obtenerNotificacionesController);

// Admin califica calidad desde una notificación
router.patch("/:notificationId/calificar", authAdmin,calificarCalidadDesdeNotificacionController);

export default router;
