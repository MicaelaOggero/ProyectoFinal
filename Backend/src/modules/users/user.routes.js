import { Router } from "express";
import { authToken, authAdmin, auth } from "../../middlewares/auth.js";
import * as userController from "./user.controller.js";
import { registerUser } from "../session/session.service.js";


const router = Router();

// Obtener todos los usuarios con rol = user (solo admin)
router.get("/", authToken, userController.getUsers);
// Obtener un usuario por ID (solo admin)
router.get("/:id", authAdmin, userController.getUserById);
// Actualizar un usuario (admin puede actualizar el perfil de cualquier user)
router.put("/:id", authAdmin, userController.updateUser);
// Eliminar un usuario (solo admin)
router.delete("/:id", authAdmin, userController.deleteUser);

//Mostrar calendario de un desarrollador (admin puede ver cualquier calendario)
router.get("/:userId/calendario", userController.obtenerCalendario);

//Editar disponibilidad de un desarrollador (admin puede editar cualquier calendario)
router.put("/:userId/calendario", auth, userController.editarCalendario);

//Crear calendario para un usuario específico
router.post("/crearCalendario/:userId", userController.crearCalendarioUsuario);

// Ruta para crear varios usuarios
router.post("/bulk", async (req, res) => {
  const usuarios = req.body; // esperamos un arreglo de objetos usuario
  if (!Array.isArray(usuarios)) {
    return res.status(400).json({ error: "Debe enviar un arreglo de usuarios" });
  }

  const resumen = [];

  for (const usuarioData of usuarios) {
    try {
      const nuevoUsuario = await registerUser(usuarioData); // llama a tu función existente
      resumen.push({
        email: usuarioData.email,
        estado: "ok",
        id: nuevoUsuario._id
      });
    } catch (err) {
      resumen.push({
        email: usuarioData.email,
        estado: "error",
        mensaje: err.message
      });
    }
  }

  return res.json({ message: "Usuarios procesados", resumen });
});


export default router;
