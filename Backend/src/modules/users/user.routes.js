import { Router } from "express";
import { authToken, authAdmin, auth } from "../../middlewares/auth.js";
import * as userController from "./user.controller.js";
import { registerUser } from "../session/session.service.js";
import { authorizeCurrentUser } from '../companies/tenant.auth.js';
import User from './user.model.js';


const router = Router();

// Obtener todos los usuarios con rol = user (solo admin)
router.get("/", auth, userController.getUsers);
// Obtener un usuario por ID (solo admin)
router.get("/:id", authAdmin, authorizeCurrentUser('id'), userController.getUserById);
// Actualizar un usuario (admin puede actualizar el perfil de cualquier user)
router.put("/:id", authAdmin, authorizeCurrentUser('id'), userController.updateUser);
// Eliminar un usuario (solo admin)
router.delete("/:id", authAdmin, authorizeCurrentUser('id'), userController.deleteUser);

//Mostrar calendario de un desarrollador (admin puede ver cualquier calendario)
router.get("/:userId/calendario", auth, authorizeCurrentUser(), userController.obtenerCalendario);

//Editar disponibilidad de un desarrollador (admin puede editar cualquier calendario)
router.put("/:userId/calendario", auth, authorizeCurrentUser(), userController.editarCalendario);

//Crear calendario para un usuario específico
router.post("/crearCalendario/:userId", auth, authorizeCurrentUser(), userController.crearCalendarioUsuario);

// Obtener candidatos disponibles para una tarea específica
router.post("/candidatos", authAdmin, userController.postCandidatosDisponiblesController);

// Ruta para crear varios usuarios
router.post("/bulk", authAdmin, async (req, res) => {
  const usuarios = req.body; // esperamos un arreglo de objetos usuario
  if (!Array.isArray(usuarios)) {
    return res.status(400).json({ error: "Debe enviar un arreglo de usuarios" });
  }

  const actor = await User.findById(req.user._id).select('rol empresa').lean();
  if (!actor || actor.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  const resumen = [];

  for (const usuarioData of usuarios) {
    try {
      const nuevoUsuario = await registerUser(usuarioData, { empresa: actor.empresa ?? null });
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
