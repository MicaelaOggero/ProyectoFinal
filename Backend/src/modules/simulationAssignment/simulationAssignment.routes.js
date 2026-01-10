//ruta para calcular datos globales de simulacion
import {calcularDatosGlobalesSimulacionController} from "../simulationAssignment/simulationAssignment.controller.js";
import { obtenerPreviewResumenController, verificarDisponibilidadAcumuladaAsignacionesManualesController, aplicarAsignacionesManualesController } from "../simulationAssignment/simulationAssignment.controller.js";
import { Router } from "express";
import { authAdmin } from "../../middlewares/auth.js";

const router = Router();

router.post("/calcular-datos-globales", authAdmin, calcularDatosGlobalesSimulacionController);

router.get("/resumen-simulacion/:projectId", obtenerPreviewResumenController);

/**
 * POST /simulationAssignment/asignaciones-manuales/verificar-disponibilidad-acumulada
 *
 * Body esperado:
 * {
 *   "asignaciones-manuales": [
 *     { "tareaId": "...", "desarrolladorId": "..." }
 *   ]
 * }
 */
router.post(
  "/asignaciones-manuales/verificar-disponibilidad-acumulada",
  verificarDisponibilidadAcumuladaAsignacionesManualesController
);

/**
 * POST /simulationAssignment/aplicar-asignaciones-manuales
 * Body: { basica, costo, tiempoIA, calidad, "asignaciones-manuales": [...] }
 */
router.post("/aplicar-asignaciones-manuales", aplicarAsignacionesManualesController);


export default router;