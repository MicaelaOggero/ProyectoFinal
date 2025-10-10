import { editarAsignacionService, getAsignacionesPorProyectoService, asignarTareasBasico, asignarPorCostoService } from "./assignment.service.js";

export const editarAsignacion = async (req, res) => {
  try {
    const { asignacionId } = req.params;
    const { nuevoDevId } = req.body;

    const asignacion = await editarAsignacionService(asignacionId, nuevoDevId);
    res.json({ message: "Asignación editada correctamente", asignacion });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAsignacionesPorProyecto = async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const asignaciones = await getAsignacionesPorProyectoService(proyectoId);

    res.json({
      message: "Asignaciones del proyecto obtenidas correctamente",
      asignaciones
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export async function asignarAutomaticoBasico(req, res) {
  try {
    const { projectId } = req.params;

    const result = await asignarTareasBasico(projectId);

    res.json(result);
  } catch (error) {
    console.error("Error en asignación automática por semana:", error);
    res.status(500).json({ error: error.message });
  }
}


export const asignarPorCosto = async (req, res) => {
  try {
    const { projectId } = req.params;
    const resultado = await asignarPorCostoService(projectId);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

