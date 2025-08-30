import {
  createTask,
  updateTask,
  deleteTask,
  findTasksByProject,
  findTasksByDeveloper
} from "./task.dao.js";

import Project from "../projects/project.model.js";
import User from "../users/user.model.js";

export async function addTask(taskData) {
  // 1. Verificar que el proyecto exista
  const proyectoExistente = await Project.findById(taskData.proyecto);
  if (!proyectoExistente) {
    throw new Error("El proyecto indicado no existe");
  }

  // 2. Verificar que el desarrollador exista (si fue asignado)
  if (taskData.desarrolladorAsignado) {
    const devExistente = await User.findById(taskData.desarrolladorAsignado);
    if (!devExistente) {
      throw new Error("El desarrollador asignado no existe");
    }
  }

  // 3. Crear la tarea
  return await createTask(taskData);
}

export async function editTask(taskId, taskData) {
  // Podés agregar las mismas validaciones si se modifica proyecto o dev
  return await updateTask(taskId, taskData);
}

export async function removeTask(taskId) {
  return await deleteTask(taskId);
}

export async function getTasksByProject(projectId) {
  return await findTasksByProject(projectId);
}

export async function getTasksByDeveloper(userId) {
  return await findTasksByDeveloper(userId);
}
