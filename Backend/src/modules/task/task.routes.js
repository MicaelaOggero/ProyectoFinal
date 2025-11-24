import express from "express";
import {
  crearTask,
  actualizarTask,
  eliminarTask,
  listarTasks,
  listarTasksPorProyecto,
  listarTasksPorDesarrollador,
  listarTasksPorProyectoYDev,
  obtenerTareasOrdenadasController,
  iniciarTareas,
  pausarOCompletarTareaController
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

// Cambiar el estado de una tarea a "en curso"
router.put("/:taskId/inciar", iniciarTareas)

// Cambiar el estado de una tarea a "pausada-completada"
router.put("/:taskId/accion", pausarOCompletarTareaController);

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

import { actualizarRendimientoDesarrollador, actualizarPuntuacionCalidadDesarrollador } from "../users/user.service.js"; // importa tu función

router.post("/taskLog/masivo", async (req, res) => {
  try {
    const logs = req.body.logs;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: "No hay logs para guardar" });
    }

    // ✅ Filtrar logs con IDs válidos
    const logsValidos = logs.filter(
      (log) =>
        /* mongoose.Types.ObjectId.isValid(log.tarea) && */
        mongoose.Types.ObjectId.isValid(log.desarrollador)
    );

    if (logsValidos.length === 0) {
      return res.status(400).json({ error: "No hay logs con IDs válidos" });
    }

    // ✅ Insertar los logs válidos
    const resultado = await TaskLog.insertMany(logsValidos);

    // ✅ Obtener los IDs únicos de desarrolladores para actualizar su rendimiento
    const desarrolladoresAActualizar = [
      ...new Set(logsValidos.map((log) => log.desarrollador.toString())),
    ];

    // ✅ Actualizar rendimiento de cada desarrollador en paralelo
    const actualizaciones = await Promise.all(
      desarrolladoresAActualizar.map(async (devId) => {
        try {
          const nuevoPromedio = await actualizarRendimientoDesarrollador(devId);
          return { devId, nuevoPromedio };
        } catch (err) {
          console.error(`Error actualizando rendimiento de ${devId}:`, err);
          return { devId, error: err.message };
        }
      })
    );

    // Actualizar puntuación de calidad de cada desarrollador en paralelo
    const actualizacionesCalidad = await Promise.all(
      desarrolladoresAActualizar.map(async (devId) => {
        try {
          const nuevaPuntuacion = await actualizarPuntuacionCalidadDesarrollador(devId);
          return { devId, nuevaPuntuacion };
        } catch (err) {
          console.error(`Error actualizando puntuación de calidad de ${devId}:`, err);
          return { devId, error: err.message };
        }
      })
    );

    res.status(201).json({
      mensaje: "Logs guardados correctamente",
      cantidad: resultado.length,
      actualizaciones,
      actualizacionesCalidad,
      logs: resultado,
    });
  } catch (error) {
    console.error("❌ Error en /taskLog/masivo:", error);
    res.status(500).json({ error: error.message });
  }
});


export default router;
