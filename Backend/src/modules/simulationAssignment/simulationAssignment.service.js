/**
 * Calcula los datos globales de una simulación a partir del resultado de la IA
 * y devuelve un objeto listo para usar con el schema SimulacionAsignacion
 *
 * @param {Object} resultadoIACompleto - Objeto con { projectId, asignaciones: [...] }
 * @returns {Object} - Datos globales para SimulacionAsignacion
 */
export function calcularDatosGlobalesSimulacion(resultadoIACompleto) {
  const { projectId, asignaciones } = resultadoIACompleto;

  if (!projectId) {
    throw new Error("Falta projectId en el resultado de la IA");
  }
  if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
    throw new Error("No hay asignaciones en el resultado de la IA");
  }

  // Tomamos el criterio desde el tipoAsignacion de la primera (o "basica" por defecto)
  const criterio = asignaciones[0]?.tipoAsignacion || "basica";

  let tiempoTotalEstimado = 0;      // suma de estimacionHoras (o fallback a horasTotales)
  let tiempoTotalSimulado = 0;      // suma de horasEstimadasSegunRendimiento (o horasTotales)
  let sumaCalidadTareas = 0;        // promedio de calidadTarea
  let sumaCalidadSimulada = 0;      // promedio de feedbackHistorico
  let contadorCalidadTareas = 0;
  let contadorCalidadSimulada = 0;
  let costoTotalSimulado = 0;       // suma de costoTotal

  for (const a of asignaciones) {
    // ⏱ tiempoTotalEstimado: usamos estimacionHoras si existe, si no, horasTotales
      tiempoTotalEstimado += Number(a.horasTotales);
    

    // ⏱ tiempoTotalSimulado: usamos horasEstimadasSegunRendimiento si existe, si no, horasTotales
    if (a.horasEstimadasSegunRendimiento != null) {
      tiempoTotalSimulado += Number(a.horasEstimadasSegunRendimiento) || 0;
    } else if (a.horasTotales != null) {
      tiempoTotalSimulado += Number(a.horasTotales) || 0;
    }

    // ⭐ calidadPromedioTareas: promedio de calidadTarea
    if (a.calidadTarea != null) {
      sumaCalidadTareas += Number(a.calidadTarea) || 0;
      contadorCalidadTareas++;
    }

    // ⭐ calidadPromedioSimulado: promedio de feedbackHistorico
    if (a.feedbackHistorico != null) {
      sumaCalidadSimulada += Number(a.feedbackHistorico) || 0;
      contadorCalidadSimulada++;
    }

    // 💰 costoTotalSimulado: suma de costoTotal
    if (a.costoTotal != null) {
      costoTotalSimulado += Number(a.costoTotal) || 0; // soporta "96" y 96
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
    proyecto: projectId,                           // ObjectId del proyecto
    criterio,                                      // "basica" | "costo" | "tiempo" | "calidad"
    // asignaciones: []  <-- esto lo vas a completar cuando guardes las Asignacion en BD
    tiempoTotalEstimado: Number(tiempoTotalEstimado.toFixed(2)),
    tiempoTotalSimulado: Number(tiempoTotalSimulado.toFixed(2)),
    calidadPromedioTareas,
    calidadPromedioSimulado,
    costoTotalSimulado: Number(costoTotalSimulado.toFixed(2))
    // creadoEn lo pone el schema solo
  };
}
