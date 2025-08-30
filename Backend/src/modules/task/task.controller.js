import {
  addTask,
  editTask,
  removeTask,
  getTasksByProject,
  getTasksByDeveloper
} from "./task.service.js";

export async function crearTask(req, res) {
  try {
    const task = await addTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function actualizarTask(req, res) {
  try {
    const task = await editTask(req.params.taskId, req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
