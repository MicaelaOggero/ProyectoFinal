import { Router } from "express";
import { authToken, authAdmin, auth } from "../../middlewares/auth.js";
import * as userController from "./user.controller.js";

const router = Router();

// Obtener todos los usuarios con rol = user (solo admin)
router.get("/", authToken, userController.getUsers);
// Obtener un usuario por ID (solo admin)
router.get("/:id", authAdmin, userController.getUserById);
// Actualizar un usuario (admin puede actualizar el perfil de cualquier user)
router.put("/:id", auth, userController.updateUser);
// Eliminar un usuario (solo admin)
router.delete("/:id", authAdmin, userController.deleteUser);

export default router;
