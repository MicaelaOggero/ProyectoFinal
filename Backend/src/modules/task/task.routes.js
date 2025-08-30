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
router.post("/", crearTask);

// Actualizar
router.put("/:taskId", actualizarTask);

// Eliminar
router.delete("/:taskId", eliminarTask);

// Listar por proyecto
router.get("/proyecto/:projectId", listarTasksPorProyecto);

// Listar por desarrollador
router.get("/desarrollador/:userId", listarTasksPorDesarrollador);

export default router;
