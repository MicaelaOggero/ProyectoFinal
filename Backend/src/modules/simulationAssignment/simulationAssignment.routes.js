//ruta para calcular datos globales de simulacion
import {calcularDatosGlobalesSimulacionController} from "../simulationAssignment/simulationAssignment.controller.js";
import { obtenerPreviewResumenController, verificarDisponibilidadAcumuladaAsignacionesManualesController, aplicarAsignacionesManualesController, obtenerSimulacionPorProyectoController } from "../simulationAssignment/simulationAssignment.controller.js";
import { Router } from "express";
import { authAdmin } from "../../middlewares/auth.js";
import { authorizeCurrentProject, authorizeAssignmentPayload } from '../companies/tenant.auth.js';

const router = Router();

router.get("/:projectId", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), obtenerSimulacionPorProyectoController);

router.post("/calcular-datos-globales", authAdmin, authorizeAssignmentPayload, calcularDatosGlobalesSimulacionController);

router.get("/resumen-simulacion/:projectId", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), obtenerPreviewResumenController);

/**
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
  authAdmin, authorizeAssignmentPayload,
  verificarDisponibilidadAcumuladaAsignacionesManualesController
);

/**
 * POST /simulationAssignment/aplicar-asignaciones-manuales
 * Body: { basica, costo, tiempoIA, calidad, "asignaciones-manuales": [...] }
 */
router.post("/aplicar-asignaciones-manuales", authAdmin, authorizeAssignmentPayload, aplicarAsignacionesManualesController);


export default router;
