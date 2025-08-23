import * as userDao from "./user.dao.js";
import * as projectDao from "../projects/project.dao.js";

// Obtener todos los usuarios (solo admins)
export const getUsers = async () => {
  return await userDao.findUsersByRole("user");
};

// Obtener un usuario por ID
export const getUserById = async (id) => {
  return await userDao.findById(id);
};

// Actualizar un usuario
export const updateUser = async (id, data) => {
  const camposAActualizar = {
    nombre: data.nombre,
    apellido: data.apellido,
    habilidades: data.habilidades,
    disponibilidadSemanal: data.disponibilidadSemanal,
    aniosExperiencia: data.aniosExperiencia,
    costoPorHora: data.costoPorHora,
    historialDesempeño: data.historialDesempeño,
  };
  return await userDao.update(id, camposAActualizar);
};

// Eliminar un usuario
export const deleteUser = async (id) => {
  const usuario = await userDao.findById(id);
  if (!usuario) return null;

  if (usuario.rol === "admin") {
    const proyectos = await projectDao.findByAdmin(usuario._id);
    if (proyectos.length > 0) {
      throw new Error("No se puede eliminar un admin que tenga proyectos asociados");
    }
  }

  return await userDao.remove(id);
};
