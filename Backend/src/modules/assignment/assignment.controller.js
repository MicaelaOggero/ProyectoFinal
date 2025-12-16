import { editarAsignacionService, getAsignacionesPorProyectoService} from "./assignment.service.js";
import { previsualizarAsignacionPorCosto, confirmarAsignacionPorCosto } from "../criteria/costo.js";
import {
  previsualizarAsignacionBasica,
  confirmarAsignacionBasica,
} from "../criteria/index.js";
import { previewObtenerAsignacionesPorTiempoIA } from "../criteria/tiempo.js";
import { confirmarAsignacionPorTiempo } from "../criteria/tiempo.js";
import { previewObtenerAsignacionesPorCalidadIA } from "../criteria/calidad.js";
import { confirmarAsignacionPorCalidad } from "../criteria/calidad.js";

export const editarAsignacion = async (req, res) => {
  try {
    const { asignacionId } = req.params;
    const { nuevoDevId } = req.body;
    const userId = req.user._id;

    const asignacion = await editarAsignacionService(asignacionId, nuevoDevId, userId);
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
    console.log("📥 Body recibido en confirmAsignacionBasica:");
    console.log(JSON.stringify(req.body, null, 2));

    const sugerencias = req.body;
    const { projectId } = sugerencias;

    if (!projectId) {
      return res.status(400).json({ error: "Falta projectId en el body" });
    }

    const resultado = await confirmarAsignacionBasica(projectId, sugerencias);
    res.json(resultado);
  } catch (error) {
    console.error("Error en confirmarAsignacionBasica:", error);
    res.status(500).json({ error: error.message });
  }
}

// Previsualiza la asignación por costo
export async function previsualizarAsignacionCosto(req, res) {
  try {
    const { projectId } = req.params;
    const resultado = await previsualizarAsignacionPorCosto(projectId);
    res.json({ message: "Previsualización lista", ...resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Confirma y guarda la asignación básica
 */
export async function confirmarAsignacionPorCostoController(req, res) {
  try {
    console.log("📥 Body recibido en confirmAsignacionBasica:");
    console.log(JSON.stringify(req.body, null, 2));

    const sugerencias = req.body;
    const { projectId } = sugerencias;

    if (!projectId) {
      return res.status(400).json({ error: "Falta projectId en el body" });
    }

    const resultado = await confirmarAsignacionPorCosto(projectId, sugerencias);
    res.json(resultado);
  } catch (error) {
    console.error("Error en confirmarAsignacionBasica:", error);
    res.status(500).json({ error: error.message });
  }
}

// Previsualiza la asignación por tiempo
export async function sugerirAsignacionTiempoIA(req, res) {
  try {
    const { projectId } = req.params;
    const resultado = await previewObtenerAsignacionesPorTiempoIA(projectId);
    res.json(resultado);
  } catch (error) {
    console.error("Error en previsualizarAsignacionTiempo:", error);
    res.status(500).json({ error: error.message });
  }
}

// Confirma y guarda la asignación por tiempo
export const confirmarAsignacionesPorTiempoController = async (req, res) => {
  try {
    console.log("📥 Body recibido en confirmAsignacionTiempo:");
    console.log(JSON.stringify(req.body, null, 2));

    const sugerencias = req.body;
    const { projectId } = sugerencias;

    if (!projectId) {
      return res.status(400).json({ error: "Falta projectId en el body" });
    }

    const resultado = await confirmarAsignacionPorTiempo(projectId, sugerencias);
    res.json(resultado);
  } catch (error) {
    console.error("Error en confirmarAsignacionTiempo:", error);
    res.status(500).json({ error: error.message });
  }
}

// Previsualiza la asignación por calidad
export const sugerirAsignacionCalidadIA = async (req, res) => {
  try {
    const { projectId } = req.params;
    const resultado = await previewObtenerAsignacionesPorCalidadIA(projectId);
    res.json(resultado);
  } catch (error) {
    console.error("Error en previsualizarAsignacionCalidad:", error);
    res.status(500).json({ error: error.message });
  }
}

// Confirma y guarda la asignación por calidad
export const confirmarAsignacionesPorCalidadController = async (req, res) => {
  try {
    console.log("📥 Body recibido en confirmAsignacionCalidad:");
    console.log(JSON.stringify(req.body, null, 2));

    const sugerencias = req.body;
    const { projectId } = sugerencias;

    if (!projectId) {
      return res.status(400).json({ error: "Falta projectId en el body" });
    }

    const resultado = await confirmarAsignacionPorCalidad(projectId, sugerencias);
    res.json(resultado);
  } catch (error) {
    console.error("Error en confirmarAsignacionCalidad:", error);
    res.status(500).json({ error: error.message });
  }
}

// Asignar un desarrollador específico a una tarea manualmente SIN modificar la BD
// controllers/asignacion.controller.js
import { asignarTareaManual } from "../assignment/assignment.service.js";

export const asignarTareaManualController = async (req, res) => {
  try {
    const asignacion = req.body;

    // Validaciones básicas
    if (!asignacion?.tareaId) {
      return res.status(400).json({ error: "Falta tareaId en la asignación" });
    }
    if (!asignacion?.desarrolladorId) {
      return res.status(400).json({ error: "Falta desarrolladorId en la asignación" });
    }
    if (!asignacion?.fechaEstimadaInicio || !asignacion?.fechaEstimadaFin) {
      return res.status(400).json({ error: "Faltan fechas de la tarea" });
    }
    if (asignacion.estimacionHoras == null) {
      return res.status(400).json({ error: "Falta estimacionHoras de la tarea" });
    }

    // Llamar a la lógica de negocio (no toca BD, solo calcula)
    const asignacionManual = asignarTareaManual(asignacion);

    // Devolver al front la nueva asignación "completada"
    return res.status(200).json(asignacionManual);

  } catch (error) {
    console.error("Error en asignarTareaManualController:", error);
    return res.status(500).json({
      error: error.message || "Error al asignar manualmente la tarea"
    });
  }
};

// controllers/asignacionManual.controller.js

import { completarAsignacionesManuales } from "../criteria/index.js";

export const completarAsignacionesManualesController = async (req, res) => {
  try {
    const resultadoIA = req.body;

    if (!resultadoIA || !resultadoIA.asignaciones) {
      return res.status(400).json({
        error: "El body debe incluir un objeto 'resultadoIA' con la propiedad 'asignaciones'."
      });
    }

    console.log("➡️ Recibido resultadoIA desde el front:", JSON.stringify(resultadoIA, null, 2));

    // Ejecutar la función principal
    const resultadoFinal = await completarAsignacionesManuales(resultadoIA);

    console.log("✅ Resultado final de asignaciones manuales:");
    console.log(JSON.stringify(resultadoFinal, null, 2));

    return res.status(200).json(resultadoFinal);

  } catch (error) {
    console.error("❌ Error en completarAsignacionesManualesController:", error);
    return res.status(500).json({
      error: error.message || "Error al completar asignaciones manuales"
    });
  }
};
