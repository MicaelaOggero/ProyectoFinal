import {
  addTask,
  editTask,
  removeTask,
  getTasksByProject,
  getTasksByDeveloper,
  getTasksByProjectAndDeveloper
} from "./task.service.js";

export async function crearTask(req, res) {
  try {
    const { projectId } = req.params;

    // unimos datos del body con el projectId de la URL
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