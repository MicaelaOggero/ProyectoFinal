import express from "express";
import {
  crearTask,
  actualizarTask,
  eliminarTask,
  listarTasksPorProyecto,
  listarTasksPorDesarrollador,
  listarTasksPorProyectoYDev
} from "./task.controller.js";
import { authToken, authAdmin, auth } from "../../middlewares/auth.js";

const router = express.Router();

// Crear
router.post("/:projectId", authAdmin, crearTask);

// Actualización de tarea
router.patch("/:taskId", authAdmin, actualizarTask);

// Eliminar
router.delete("/:taskId", authAdmin, eliminarTask);

// Listar por proyecto
router.get("/proyecto/:projectId", auth, listarTasksPorProyecto);

// Listar por desarrollador
router.get("/desarrollador/:userId", auth, listarTasksPorDesarrollador);

// Listar tarea por proyecto y desarrollador
router.get("/proyecto/:projectId/desarrollador/:developerId", auth, listarTasksPorProyectoYDev);

export default router;
