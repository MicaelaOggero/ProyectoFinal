import * as projectDao from "./project.dao.js";

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
  const { nombre, descripcion, fechaInicio, fechaFin, nivelDificultad, prioridad, estado } = projectData;

  return await projectDao.create({
    nombre,
    descripcion,
    fechaInicio,
    fechaFin,
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
