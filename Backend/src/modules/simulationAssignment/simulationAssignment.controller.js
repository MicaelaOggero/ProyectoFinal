import {
  calcularDatosGlobalesSimulacion,
  obtenerPreviewResumenService, verificarDisponibilidadAcumuladaAsignacionesManualesService, aplicarAsignacionesManualesService, calcularDatosGlobalesSimulacionPorCriterio
} from "./simulationAssignment.service.js";

export const calcularDatosGlobalesSimulacionController = async (req, res) => {
  try {
    const resultadoIACompleto = req.body;

    if (!resultadoIACompleto || typeof resultadoIACompleto !== "object") {
      return res.status(400).json({
        ok: false,
        message: "Body inválido. Se esperaba un objeto con projectId y asignaciones.",
      });
    }

    const { projectId, asignaciones } = resultadoIACompleto;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Falta projectId en el body." });
    }

    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No hay asignaciones en el body (asignaciones debe ser un array con elementos).",
      });
    }

    // ✅ ahora sí: devuelve el objeto
    const datosGlobales = calcularDatosGlobalesSimulacion(resultadoIACompleto);

    return res.status(200).json({
      ok: true,
      message: "Datos globales calculados correctamente.",
      data: datosGlobales,
    });
  } catch (error) {
    const msg = error?.message || "Error interno";
    return res.status(500).json({ ok: false, message: msg });
  }
};

export async function obtenerPreviewResumenController(req, res) {
  try {
    const { projectId } = req.params;
    const resultado = await obtenerPreviewResumenService(projectId);
    return res.json(resultado);
  } catch (error) {
    console.error("Error en obtenerPreviewResumenService:", error);
    return res.status(500).json({ error: error.message });
  }
}


export async function verificarDisponibilidadAcumuladaAsignacionesManualesController(req, res) {
  try {
    const payload = req.body;

    // Validación mínima (el service ya valida más)
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({
        ok: false,
        message: "Body inválido. Se esperaba un objeto.",
      });
    }

    const resultado = await verificarDisponibilidadAcumuladaAsignacionesManualesService(payload);

    // Si el service marca ok=false, devolvemos 200 igual (es una validación),
    // pero podés cambiar a 409 si preferís "conflicto de disponibilidad".
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en verificarDisponibilidadAcumuladaAsignacionesManualesController:", error);

    // Errores esperables de validación
    const msg = error?.message || "Error interno";

    if (
      msg.includes('Falta "asignaciones-manuales"') ||
      msg.includes("Body inválido") ||
      msg.includes("Se esperaba")
    ) {
      return res.status(400).json({
        ok: false,
        message: msg,
      });
    }

    // Error genérico
    return res.status(500).json({
      ok: false,
      message: "Error interno al verificar disponibilidad acumulada.",
      error: msg,
    });
  }
}

const normalizarCriterios = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const resultado = { ...obj };

  // Nivel directo
  if (resultado.tiempoIA) {
    resultado.tiempo = resultado.tiempoIA;
    delete resultado.tiempoIA;
  }

  // Nivel globalesPorCriterio interno
  if (resultado.globalesPorCriterio && typeof resultado.globalesPorCriterio === "object") {
    const g = { ...resultado.globalesPorCriterio };

    if (g.tiempoIA) {
      g.tiempo = g.tiempoIA;
      delete g.tiempoIA;
    }

    resultado.globalesPorCriterio = g;
  }

  return resultado;
};


export const aplicarAsignacionesManualesController = async (req, res) => {
  try {
    const resultadoCorregido = await aplicarAsignacionesManualesService(req.body);

    // 👇 ACÁ el paso clave
    const globalesPorCriterio =
      calcularDatosGlobalesSimulacionPorCriterio(resultadoCorregido);

    return res.status(200).json({
      ok: true,
      message: "Asignaciones manuales aplicadas correctamente.",
      data: normalizarCriterios(resultadoCorregido),
      globalesPorCriterio: normalizarCriterios(globalesPorCriterio.globalesPorCriterio),
    });
  } catch (error) {
    console.error("❌ Error en aplicarAsignacionesManualesController:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al aplicar asignaciones manuales.",
      error: error.message,
    });
  }
};
