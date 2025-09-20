import Asignacion from "./assignment.model.js";

export const findAsignacionById = (id) => Asignacion.findById(id).populate("tarea").populate("desarrollador");
export const saveAsignacion = (asignacion) => asignacion.save();
export const saveUser = (user) => user.save();
export const saveTask = (task) => task.save();

// Buscar asignaciones por proyecto, populando tarea y desarrollador
export const findAsignacionesByProyecto = async (proyectoId) => {
  return Asignacion.find({ proyecto: proyectoId })
    .populate("tarea") // trae toda la info de la tarea
    .populate("desarrollador"); // trae info del dev
};

