import * as projectDao from "./project.dao.js";
import Project from "./project.model.js";
import Task from "../task/task.model.js";

// Obtener proyectos por administrador
export const getProjects = async (adminId) => {
  return await projectDao.findByAdmin(adminId);
};

// Obtener un proyecto por ID
export const getProjectById = async (id) => {
  return await projectDao.findById(id);
};

// Crear un nuevo proyecto
export const createProject = async (projectData, adminId) => {
  const { nombre, descripcion, fechaInicioEstimada, fechaFinEstimada, nivelDificultad, prioridad, estado } = projectData;

  return await projectDao.create({
    nombre,
    descripcion,
    fechaInicioEstimada,
    fechaFinEstimada,
    nivelDificultad,
    prioridad,
    estado,
    administrador: adminId,
  });
};

// Actualizar un proyecto por ID
export const updateProject = async (id, updatedData) => {
  return await projectDao.update(id, updatedData);
};

// Eliminar un proyecto por ID
export const deleteProject = async (id) => {
  return await projectDao.remove(id);
};

/**
 * Marca un proyecto como iniciado
 * @param {String} projectId - ID del proyecto
 */
export async function iniciarProyectoService(projectId, userId) {
  const proyecto = await projectDao.findById(projectId);
  if (!proyecto) {
    throw new Error("Proyecto no encontrado");
  }

  const user = await projectDao.findUserById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Si ya estaba iniciado, evitamos duplicar
  if (proyecto.estado === "activo") {
    throw new Error("El proyecto ya está iniciado");
  }

   // Verificar si tiene tareas asociadas
  const tareas = await Task.find({ proyecto: projectId });
  if (!tareas || tareas.length === 0) {
    throw new Error("No se puede iniciar un proyecto sin tareas asociadas");
  }

  //Verificar que todas las tareas estén asignadas
  const tareasSinAsignar = tareas.filter(tarea => !tarea.desarrolladorAsignado);
  if (tareasSinAsignar.length > 0) {
    throw new Error("No se puede iniciar el proyecto mientras haya tareas sin asignar");
  }

  // Actualizar estado y fecha de inicio 
  proyecto.fechaInicioReal = new Date(); // 🔹 fecha actual
  proyecto.estado = "en curso";

  // Actualizar historial
  proyecto.historial.push({
    accion: "Inicio de proyecto",
    usuario: userId,
    descripcion: `El proyecto fue iniciado por el usuario ${user.nombre}`,
  });

  await proyecto.save();
  return proyecto;
}

/**
 * Pausa un proyecto en curso y registra el cambio en su historial.
 * @param {String} projectId - ID del proyecto
 * @param {String} userId - ID del usuario que realiza la acción
 */
export async function pausarProyectoService(projectId, userId) {
  const proyecto = await Project.findById(projectId);
  if (!proyecto) throw new Error("Proyecto no encontrado");

  // 🔹 Validar estado actual
  if (proyecto.estado !== "en curso") {
    throw new Error("Solo se pueden pausar proyectos en curso");
  }

  // 🔹 Verificar si tiene tareas en curso
  const tareasEnCurso = await Task.find({ tarea: projectId, estado: "en curso" });
  if (tareasEnCurso.length) {
    throw new Error("No se pueden pausar el proyecto mientras haya tareas en curso");
  }

  // 🔹 Actualizar estado y agregar entrada al historial
  proyecto.estado = "pausado";
  proyecto.historial.push({
    accion: "Pausa de proyecto",
    usuario: userId,
    descripcion: `El proyecto fue pausado por el usuario ${userId}`
  });

  await proyecto.save();

  return proyecto;
}

export async function finalizarProyectoService(projectId, userId) {
  const proyecto = await Project.findById(projectId);
  if (!proyecto) throw new Error("Proyecto no encontrado");
  // 🔹 Validar estado actual
  if (proyecto.estado !== "en curso" && proyecto.estado !== "pausado") {
    throw new Error("Solo se pueden finalizar proyectos en curso o pausados");
  }
  // 🔹 Verificar si todas las tareas están completadas
  const tareasIncompletas = await Task.find({ proyecto: projectId, estado: { $ne: "completada" } });
  if (tareasIncompletas.length) {
    throw new Error("No se pueden finalizar el proyecto mientras haya tareas incompletas");
  }
  // 🔹 Actualizar estado y fecha de finalización
  proyecto.estado = "completado";
  proyecto.fechaFinReal = new Date();
  proyecto.historial.push({
    accion: "Finalización de proyecto",
    usuario: userId,
    descripcion: `El proyecto fue finalizado por el usuario ${userId}`
  });

  await proyecto.save();
  return proyecto;
}