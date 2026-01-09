import {
  calcularDatosGlobalesSimulacion,
  obtenerPreviewResumenService,
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
