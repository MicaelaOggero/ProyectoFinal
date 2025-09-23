import * as userDao from "./user.dao.js";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js"; 

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

/**
 * Editar calendario de un desarrollador
 * @param {String} userId - ID del desarrollador
 * @param {Array} cambios - [{ fecha, horasDisponibles }]
 */
export const editarCalendarioService = async (userId, cambios) => {
  const dev = await userDao.findUser(userId);
  if (!dev) throw new Error("Desarrollador no encontrado");

  for (const cambio of cambios) {
    const fechaISO = new Date(cambio.fecha).toISOString().split("T")[0];

    // 1️⃣ Verificar si hay tareas asignadas a ese día
    const tareasAsignadas = await Task.find({
      desarrolladorAsignado: dev._id,
      fechaEstimadaInicio: { $lte: new Date(cambio.fecha) },
      fechaEstimadaFin: { $gte: new Date(cambio.fecha) }
    });

    if (tareasAsignadas.length > 0) {
      // no permitir editar
      throw new Error(
        `No se puede modificar ${fechaISO}, tiene tareas asignadas.`
      );
    }

    // 2️⃣ Buscar el día en el calendario
    let reg = dev.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === fechaISO
    );

    if (reg) {
      reg.horasDisponibles = cambio.horasDisponibles;
    } else {
      dev.calendario.push({
        fecha: new Date(cambio.fecha),
        horasDisponibles: cambio.horasDisponibles
      });
    }
  }

  await userDao.saveUser(dev);
  return dev;
};
