import { editarAsignacionService, getAsignacionesPorProyectoService, asignarTareasBasico, asignarPorCostoService} from "./assignment.service.js";
import { previsualizarAsignacionPorCosto, confirmarAsignacionPorCosto } from "../criteria/costo.js";
import {
  previsualizarAsignacionBasica,
  confirmarAsignacionBasica,
} from "../criteria/index.js";

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


// PREVISUALIZACIÓN
export async function previsualizarAsignacionCosto(req, res) {
  try {
    const { projectId } = req.params;
    const resultado = await previsualizarAsignacionPorCosto(projectId);
    res.json({ message: "Previsualización lista", ...resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// CONFIRMACIÓN
export async function confirmarAsignacionCosto(req, res) {
  try {
    const { projectId } = req.params;
    const { asignaciones, costoTotalProyecto } = req.body;

    const resultado = await confirmarAsignacionPorCosto(
      projectId,
      asignaciones,          // 👈 acá va el array directamente
      costoTotalProyecto     // 👈 número total
    );

    res.json({ message: "Asignaciones guardadas", resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


/**
 * Previsualiza la asignación básica
 */
export async function previewAsignacionBasica(req, res) {
  try {
    const { projectId } = req.params;
    const resultado = await previsualizarAsignacionBasica(projectId);
    res.json(resultado);
  } catch (error) {
    console.error("Error en previsualizarAsignacionBasica:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Confirma y guarda la asignación básica
 */
export async function confirmAsignacionBasica(req, res) {
  try {
    const { projectId } = req.params;
    const { asignaciones, costoTotalProyecto } = req.body;
    const resultado = await confirmarAsignacionBasica(projectId, asignaciones, costoTotalProyecto);
    res.json(resultado);
  } catch (error) {
    console.error("Error en confirmarAsignacionBasica:", error);
    res.status(500).json({ error: error.message });
  }
}
