import { Router } from "express";
import { auth, authToken } from "../../middlewares/auth.js";
import * as sessionController from "./session.controller.js";

const router = Router();

// Rutas de autenticación
router.post("/register", sessionController.registerUser);
router.post("/login", sessionController.loginUser);
router.delete("/logout", authToken, sessionController.logoutUser);

// Gestión de perfil
router.get("/profile", auth, sessionController.getProfile);
router.put("/me", authToken, sessionController.updateMe);
router.patch("/reset-password", sessionController.resetPassword);

// Google OAuth
router.get("/auth/google", sessionController.googleAuth);
router.get("/auth/google/callback", sessionController.googleCallback);

export default router;