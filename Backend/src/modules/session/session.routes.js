import { Router } from "express";
import { auth, authToken } from "../../middlewares/auth.js";
import * as sessionController from "./session.controller.js";

const router = Router();

// Rutas de autenticación

// Registro tradicional, login y logout
router.post("/register", sessionController.registerUser);
router.post("/login", sessionController.loginUser);
router.delete("/logout", authToken, sessionController.logoutUser);

// Gestión de perfil

// Obtener perfil del usuario logueado, actualizar su info y resetear su password
router.get("/profile", auth, sessionController.getProfile);
// Actualizar mi perfil del usuario logueado
router.put("/me", auth, sessionController.updateMe);
// Resetear mi password (debe estar logueado)
router.patch("/reset-password", sessionController.resetPassword);

// Google OAuth

// Iniciar login con Google
router.get("/auth/google", sessionController.googleAuth);
// Callback de Google
router.get("/auth/google/callback", sessionController.googleCallback);

router.get("/dashboard", auth, sessionController.dashboardController);

router.get("/google-session", auth, sessionController.getGoogleSession);
export default router;