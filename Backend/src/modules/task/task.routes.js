import express from "express";
import {
  crearTask,
  actualizarTask,
  eliminarTask,
  listarTasksPorProyecto,
  listarTasksPorDesarrollador
} from "./task.controller.js";

const router = express.Router();

// Crear
router.post("/:projectId", crearTask);

// Actualización parcial de tarea
router.patch("/:taskId", actualizarTask);

// Eliminar
router.delete("/:taskId", eliminarTask);

// Listar por proyecto
router.get("/proyecto/:projectId", listarTasksPorProyecto);

// Listar por desarrollador
router.get("/desarrollador/:userId", listarTasksPorDesarrollador);

// Listar tarea por proyecto y desarrollador

export default router;
