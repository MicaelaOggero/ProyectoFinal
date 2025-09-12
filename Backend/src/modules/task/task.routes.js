import express from "express";
import {
  crearTask,
  actualizarTask,
  eliminarTask,
  listarTasksPorProyecto,
  listarTasksPorDesarrollador,
  listarTasksPorProyectoYDev,
  asignarAutomaticoController,
  obtenerTareasOrdenadasController,
  asignarAutomaticoPorSemanaController
} from "./task.controller.js";
import { authToken, authAdmin, auth } from "../../middlewares/auth.js";
import { addTask } from "./task.service.js";

const router = express.Router();


// Crear
router.post("/:projectId", authAdmin, crearTask);

// Actualización de tarea
router.patch("/:taskId", authAdmin, actualizarTask);

// Eliminar
router.delete("/:taskId", authAdmin, eliminarTask);

// Listar todas las tareas (solo admin)

// Listar por proyecto
router.get("/proyecto/:projectId", auth, listarTasksPorProyecto);

// Listar por desarrollador
router.get("/desarrollador/:userId", auth, listarTasksPorDesarrollador);

// Listar tarea por proyecto y desarrollador
router.get("/proyecto/:projectId/desarrollador/:developerId", auth, listarTasksPorProyectoYDev);

// Asignación automática de tareas
router.post("/tasks/asignar-automatico", authAdmin, asignarAutomaticoController);

// Obtener tareas ordenadas por prioridad y dificultad
router.get("/ordenadas/:projectId", authAdmin, obtenerTareasOrdenadasController);

// Ruta de asignación automática por semana
router.post("/asignar-automatico/:projectId", authAdmin, asignarAutomaticoPorSemanaController);

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

export default router;
