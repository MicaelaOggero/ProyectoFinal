import express from "express";
import {
  crearTask,
  actualizarTask,
  eliminarTask,
  listarTasks,
  listarTasksPorProyecto,
  listarTasksPorDesarrollador,
  listarTasksPorProyectoYDev,
  obtenerTareasOrdenadasController
} from "./task.controller.js";
import { authAdmin, auth } from "../../middlewares/auth.js";
import { addTask } from "./task.service.js";

const router = express.Router();


// Crear
router.post("/:projectId", authAdmin, crearTask);

// Actualización de tarea
router.patch("/:taskId", authAdmin,actualizarTask);

// Eliminar
router.delete("/:taskId", authAdmin, eliminarTask);

// Listar por proyecto
router.get("/proyecto/:projectId", auth, listarTasksPorProyecto);

// Listar por desarrollador
router.get("/desarrollador/:userId", auth, listarTasksPorDesarrollador);

// Listar todas las tareas (solo admin)
router.get("/", authAdmin, listarTasks)

// Listar tarea por proyecto y desarrollador
router.get("/proyecto/:projectId/desarrollador/:developerId", auth, listarTasksPorProyectoYDev);

// Obtener tareas ordenadas por prioridad y dificultad
router.get("/ordenadas/:projectId", authAdmin, obtenerTareasOrdenadasController);

// 📌 Ruta para crear varias tareas dentro de un proyecto
router.post("/bulk/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const tareas = req.body;

  if (!Array.isArray(tareas)) {
    return res.status(400).json({ error: "Debe enviar un arreglo de tareas" });
  }

  const resumen = [];

  for (const tareaData of tareas) {
    try {
      const task = await addTask({ ...tareaData, proyecto: projectId });
      resumen.push({
        descripcion: tareaData.descripcion,
        estado: "ok",
        id: task._id
      });
    } catch (error) {
      resumen.push({
        descripcion: tareaData.descripcion,
        estado: "error",
        mensaje: error.message
      });
    }
  }

  res.json({ message: "Tareas procesadas", resumen });
});

// TaskLog masivos 
// routes/taskLog.routes.js
import TaskLog from "../task/taskLog.model.js";
import mongoose from "mongoose";
/**
 * POST /tasklogs/masivo
 * Inserta múltiples logs de tareas de manera masiva
 * Verifica que los IDs de tarea y desarrollador sean válidos
 */
router.post("/taskLog/masivo", async (req, res) => {
  try {
    const logs = req.body.logs;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: "No hay logs para guardar" });
    }

    // Filtrar logs con IDs inválidos
    const logsValidos = logs.filter(log => 
      //mongoose.Types.ObjectId.isValid(log.tarea) &&
      mongoose.Types.ObjectId.isValid(log.desarrollador)
    );

    if (logsValidos.length === 0) {
      return res.status(400).json({ error: "No hay logs con IDs válidos" });
    }

    // Insertar solo los logs válidos
    const resultado = await TaskLog.insertMany(logsValidos);

    res.status(201).json({
      mensaje: "Logs guardados correctamente",
      cantidad: resultado.length,
      logs: resultado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
