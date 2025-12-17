// controllers/simulacion.controller.js
import calcularDatosGlobalesSimulacion from "../simulationAssignment/simulationAssignment.service.js"; 
// ↑ ajustá la ruta según dónde tengas la función (o importala desde utils)

export const calcularDatosGlobalesSimulacionController = async (req, res) => {
  try {
    const resultadoIACompleto = req.body;

    // Validación mínima de payload
    if (!resultadoIACompleto || typeof resultadoIACompleto !== "object") {
      return res.status(400).json({
        ok: false,
        message: "Body inválido. Se esperaba un objeto con projectId y asignaciones.",
      });
    }

    const { projectId, asignaciones } = resultadoIACompleto;

    if (!projectId) {
      return res.status(400).json({
        ok: false,
        message: "Falta projectId en el body.",
      });
    }

    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No hay asignaciones en el body (asignaciones debe ser un array con elementos).",
      });
    }

    // Cálculo
    const datosGlobales = calcularDatosGlobalesSimulacion(resultadoIACompleto);

    return res.status(200).json({
      ok: true,
      message: "Datos globales calculados correctamente.",
      data: datosGlobales,
    });
  } catch (error) {
    console.error("❌ Error en calcularDatosGlobalesSimulacionController:", error);

    // Errores esperables lanzados por tu función
    const msg = error?.message || "Error interno";

    if (
      msg.includes("Falta projectId") ||
      msg.includes("No hay asignaciones")
    ) {
      return res.status(400).json({
        ok: false,
        message: msg,
      });
    }

    // Error genérico
    return res.status(500).json({
      ok: false,
      message: "Error interno al calcular datos globales.",
      error: msg,
    });
  }
};
