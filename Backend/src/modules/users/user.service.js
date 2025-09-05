import * as userDao from "./user.dao.js";
import Project from "../projects/project.model.js";

// Obtener todos los usuarios (si es admin devuelve los 'user', si es user devuelve lista vacía)
export const getUsers = async (rol) => {
  if (rol === "admin") {
    return await userDao.findUsersByRole("user");
  }
  if (rol === "user") {
    return [];
  }
  throw new Error("Rol no autorizado");
};

// Obtener un usuario por ID
export const getUserById = async (id) => {
  return await userDao.findUserById(id);
};

// Actualizar un usuario
export const updateUser = async (id, data) => {
  return await userDao.updateUser(id, data);
};

// Eliminar un usuario
export const deleteUser = async (id) => {
  const usuario = await userDao.findUserById(id);
  if (!usuario) return null;

  // Si el usuario es admin, revisar proyectos asociados
  if (usuario.rol === "admin") {
    const proyectos = await Project.find({ administrador: usuario._id });
    if (proyectos.length > 0) {
      throw new Error("No se puede eliminar un admin que tenga proyectos asociados");
    }
  }

  return await userDao.deleteUser(id);
};
