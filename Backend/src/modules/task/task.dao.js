import Task from "./task.model.js";

// Crear
export async function createTask(data) {
  return await Task.create(data);
}

// Actualizar por ID
export async function updateTask(taskId, data) {
  return await Task.findByIdAndUpdate(taskId, data, { new: true });
}

// Eliminar por ID
export async function deleteTask(taskId) {
  return await Task.findByIdAndDelete(taskId);
}

// Listar tareas por proyecto
export async function findTasksByProject(projectId) {
  return await Task.find({ proyecto: projectId })
    .populate("desarrolladorAsignado", "nombre email");
}

// Listar tareas por desarrollador
export async function findTasksByDeveloper(userId) {
  return await Task.find({ desarrolladorAsignado: userId })
    .populate("proyecto", "nombre")
    .populate("desarrolladorAsignado", "nombre email");
}
