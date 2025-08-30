import {
  createTask,
  saveTask,
  getTaskByIdDAO,
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

export async function editTask(taskId, taskData, usuarioId) {
  // 1. Buscar la tarea
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  // 2. Si se cambia desarrollador, validar que exista
  if (taskData.desarrolladorAsignado !== undefined && taskData.desarrolladorAsignado !== null) {
    const devExistente = await User.findById(taskData.desarrolladorAsignado);
    if (!devExistente) throw new Error("El desarrollador asignado no existe");
  }

  // 3. Recorrer campos enviados y registrar historial
  for (const key of Object.keys(taskData)) {
    const valorAnterior = tarea[key];
    const valorNuevo = taskData[key];

    // Guardar solo si cambió
    if (valorNuevo !== undefined && valorNuevo !== valorAnterior) {
      tarea.historial.push({
        campo: key,
        valorAnterior,
        valorNuevo,
        cambiadoPor: usuarioId,
        fechaCambio: new Date()
      });

      tarea[key] = valorNuevo;
    }
  }

  // 4. Guardar tarea
  await saveTask(tarea);
  return tarea;
}

export async function getTaskById(taskId) {
  const tarea = await getTaskByIdDAO(taskId);

  if (!tarea) {
    throw new Error("Tarea no encontrada");
  }

  return tarea;
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
