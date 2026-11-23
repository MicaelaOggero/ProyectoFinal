import SimulacionAsignacion from "./simulationAssignment.model.js";

export const findSimulacionByAsignacionId = async (asignacionId) => {
  const simulacion = await SimulacionAsignacion.findOne({
    asignaciones: asignacionId
  });

  if (!simulacion)
    throw new Error("No se encontró una simulación para esta asignación");

  return simulacion;
};

export const findSimulacionByProyectoDAO = async (projectId) => {
  return await SimulacionAsignacion.find({ proyecto: projectId })
    .select("-asignaciones") // 🚫 excluye el array de asignaciones
    .sort({ creadoEn: -1 }); // más recientes primero
};


