import Task from "./task.model.js";

// Crear
export async function createTask(data) {
  return await Task.create(data);
}

// Obtener tarea por ID (DAO mínimo)
export async function getTaskByIdDAO(taskId) {
  return await Task.findById(taskId);
}

// Guardar cambios en la tarea
export async function saveTask(task) {
  return await task.save();
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

// Buscar tareas por proyecto y desarrollador
export async function findTasksByProjectAndDeveloper(projectId, developerId) {
  const filtro = { proyecto: projectId };
  if (developerId) {
    filtro.desarrolladorAsignado = developerId;
  }
  return await Task.find(filtro);
}
