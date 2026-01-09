/**
 * Calcula los datos globales de una simulación a partir del resultado de la IA
 */
export const calcularDatosGlobalesSimulacion = (resultadoIACompleto) => {
  const { projectId, asignaciones } = resultadoIACompleto;

  if (!projectId) throw new Error("Falta projectId en el resultado de la IA");
  if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
    throw new Error("No hay asignaciones en el resultado de la IA");
  }

  const criterio = asignaciones[0]?.tipoAsignacion || "basica";

  let tiempoTotalEstimado = 0;
  let tiempoTotalSimulado = 0;
  let sumaCalidadTareas = 0;
  let sumaCalidadSimulada = 0;
  let contadorCalidadTareas = 0;
  let contadorCalidadSimulada = 0;
  let costoTotalSimulado = 0;

  for (const a of asignaciones) {
    tiempoTotalEstimado += Number(a.horasTotales) || 0;

    if (a.horasEstimadasSegunRendimiento != null) {
      tiempoTotalSimulado += Number(a.horasEstimadasSegunRendimiento) || 0;
    } else if (a.horasTotales != null) {
      tiempoTotalSimulado += Number(a.horasTotales) || 0;
    }

    if (a.calidadTarea != null) {
      sumaCalidadTareas += Number(a.calidadTarea) || 0;
      contadorCalidadTareas++;
    }

    if (a.feedbackHistorico != null) {
      sumaCalidadSimulada += Number(a.feedbackHistorico) || 0;
      contadorCalidadSimulada++;
    }

    if (a.costoTotal != null) {
      costoTotalSimulado += Number(a.costoTotal) || 0;
    }
  }

  const calidadPromedioTareas =
    contadorCalidadTareas > 0
      ? Number((sumaCalidadTareas / contadorCalidadTareas).toFixed(2))
      : 0;

  const calidadPromedioSimulado =
    contadorCalidadSimulada > 0
      ? Number((sumaCalidadSimulada / contadorCalidadSimulada).toFixed(2))
      : 0;

  return {
    proyecto: projectId,
    criterio,
    tiempoTotalEstimado: Number(tiempoTotalEstimado.toFixed(2)),
    tiempoTotalSimulado: Number(tiempoTotalSimulado.toFixed(2)),
    calidadPromedioTareas,
    calidadPromedioSimulado,
    costoTotalSimulado: Number(costoTotalSimulado.toFixed(2)),
  };
};

// ---- PREVIEW INCOMPLETO (4 JSON) ----
import { previsualizarAsignacionBasica } from "../criteria/index.js";
import { previsualizarAsignacionPorCosto } from "../criteria/costo.js";
import { previewObtenerAsignacionesPorTiempoIA } from "../criteria/tiempo.js";
import { previewObtenerAsignacionesPorCalidadIA } from "../criteria/calidad.js";

export const obtenerPreviewResumenService = async (projectId) => {
  if (!projectId) throw new Error("projectId es requerido");

  const [jsonBasica, jsonCosto, jsonTiempoIA, jsonCalidad] = await Promise.all([
    previsualizarAsignacionBasica(projectId),
    previsualizarAsignacionPorCosto(projectId),
    previewObtenerAsignacionesPorTiempoIA(projectId),
    previewObtenerAsignacionesPorCalidadIA(projectId),
  ]);

  return {
    basica: jsonBasica,
    costo: jsonCosto,
    tiempoIA: jsonTiempoIA,
    calidad: jsonCalidad,
  };
};
