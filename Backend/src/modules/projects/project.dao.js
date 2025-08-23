import Project from "./project.model.js";

// Buscar proyectos de un administrador
export const findByAdmin = async (adminId) => {
  return await Project.find({ administrador: adminId });
};

// Buscar proyecto por ID
export const findById = async (id) => {
  return await Project.findById(id);
};

// Crear nuevo proyecto
export const create = async (data) => {
  return await Project.create(data);
};

// Actualizar proyecto por ID
export const update = async (id, data) => {
  return await Project.findByIdAndUpdate(id, data, { new: true });
};

// Eliminar proyecto por ID
export const remove = async (id) => {
  return await Project.findByIdAndDelete(id);
};
