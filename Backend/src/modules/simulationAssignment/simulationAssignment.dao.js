import SimulacionAsignacion from "./simulationAssignment.model.js";

export const findSimulacionByAsignacionId = async (asignacionId) => {
  const simulacion = await SimulacionAsignacion.findOne({
    asignaciones: asignacionId
  });

  if (!simulacion)
    throw new Error("No se encontró una simulación para esta asignación");

  return simulacion;
};

