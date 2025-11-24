import {
  addTask,
  editTask,
  removeTask,
  getTasksByProject,
  getTasksByDeveloper,
  getTasksByProjectAndDeveloper,
  obtenerTareasOrdenadasPorProyecto,
  obtenerTodasTareasService,
  iniciarTareaService
} from "./task.service.js";

export async function crearTask(req, res) {
  try {
    const { projectId } = req.params;
    const taskData = { ...req.body, proyecto: projectId };

    const task = await addTask(taskData);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function actualizarTask(req, res) {
  try {
    const { taskId } = req.params;
    const usuarioId = req.user?._id; // asumimos que el middleware auth agrega req.user
    const taskData = req.body;

    const tareaActualizada = await editTask(taskId, taskData, usuarioId);
    res.json(tareaActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function listarTasks(req, res) {
  //obtener todas las tareas de la base de datos
  try {
    const tareas = await obtenerTodasTareasService();
    res.status(200).json(tareas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTaskById(req, res) {
  try {
    const { taskId } = req.params;

    const tarea = await getTaskById(taskId);
    res.json(tarea);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

export async function eliminarTask(req, res) {
  try {
    await removeTask(req.params.taskId);
    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function listarTasksPorProyecto(req, res) {
  try {
    const tasks = await getTasksByProject(req.params.projectId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listarTasksPorDesarrollador(req, res) {
  try {
    const tasks = await getTasksByDeveloper(req.params.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listarTasksPorProyectoYDev(req, res) {
  try {
    const { projectId, developerId } = req.params;
    const tasks = await getTasksByProjectAndDeveloper(projectId, developerId);
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export const obtenerTareasOrdenadasController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tareasOrdenadas = await obtenerTareasOrdenadasPorProyecto(projectId);
    res.json({ tareas: tareasOrdenadas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const iniciarTareas = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const tarea = await iniciarTareaService(taskId, userId);
    res.json({
      message: "✅ Tarea iniciada correctamente",
      tarea: {
        id: tarea._id,
        descripcion: tarea.descripcion,
        estado: tarea.estado,
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// src/modules/task/task.controller.js
import { pausarOCompletarTarea } from "./task.service.js";

export const pausarOCompletarTareaController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, accion } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos (taskId o userId)" });
    }

    const resultado = await pausarOCompletarTarea(taskId, userId, accion);

    res.status(200).json({
      success: true,
      message: resultado.message,
      horasTotales: resultado.horasTotales,
      rendimientoActualizado: resultado.rendimientoActualizado,
    });
  } catch (error) {
    console.error("❌ Error en pausarOCompletarTareaController:", error);
    res.status(500).json({ error: error.message });
  }
};
