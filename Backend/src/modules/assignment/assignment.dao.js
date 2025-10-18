import Asignacion from "./assignment.model.js";

export const findAsignacionById = async (id) => {
  return await Asignacion.findById(id)
    .populate("tarea")             // ← para traer la info completa de la tarea
    .populate("desarrollador")     // ← para traer también el dev original
    .populate({
      path: "tarea",
      populate: { path: "proyecto" } // ← para tener acceso a tarea.proyecto
    });
};

export const saveAsignacion = (asignacion) => asignacion.save();
export const saveUser = (user) => user.save();
export const saveTask = (task) => task.save();

// Buscar asignaciones por proyecto, populando tarea y desarrollador
export const findAsignacionesByProyecto = async (proyectoId) => {
  return Asignacion.find({ proyecto: proyectoId })
    .populate("tarea") // trae toda la info de la tarea
    .populate("desarrollador"); // trae info del dev
};

