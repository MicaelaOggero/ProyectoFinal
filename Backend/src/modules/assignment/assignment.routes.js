import { Router } from "express";
import { editarAsignacion, getAsignacionesPorProyecto, previsualizarAsignacionCosto, previewAsignacionBasica, confirmAsignacionBasica, confirmarAsignacionPorCostoController, asignarTareaManualController } from "./assignment.controller.js";
import { sugerirAsignacionTiempoIA, confirmarAsignacionesPorTiempoController, sugerirAsignacionCalidadIA, confirmarAsignacionesPorCalidadController } from "../assignment/assignment.controller.js";
import { completarAsignacionesManualesController } from "../assignment/assignment.controller.js";
import { auth, authAdmin } from "../../middlewares/auth.js";
import { authorizeCurrentProject, authorizeAssignmentRecord, authorizeAssignmentPayload } from '../companies/tenant.auth.js';
const router = Router();
const manageProject = [authAdmin, authorizeCurrentProject('projectId', { adminOnly: true })];

// Editar asignación existente
router.put("/:asignacionId", authAdmin, authorizeAssignmentRecord, editarAsignacion);

// Obtener asignaciones por proyecto
router.get("/proyecto/:proyectoId", auth, authorizeCurrentProject('proyectoId'), getAsignacionesPorProyecto);

// 🔹 Asignación básica
router.get("/iapreview/proyecto/:projectId/basica", ...manageProject, previewAsignacionBasica);
router.post("/iaconfirm/proyecto/:projectId/basica", ...manageProject, confirmAsignacionBasica);

// 🔹 Asignación por costo
router.get("/iapreview/proyecto/:projectId/costo", ...manageProject, previsualizarAsignacionCosto);
router.post("/iaconfirm/proyecto/:projectId/costo", ...manageProject, confirmarAsignacionPorCostoController);

// 🔹 Asignación tiempo
router.get("/iapreview/proyecto/:projectId/tiempo", ...manageProject, sugerirAsignacionTiempoIA);
router.post("/iaconfirm/proyecto/:projectId/tiempo", ...manageProject, confirmarAsignacionesPorTiempoController);

// 🔹 Asignación calidad
router.get("/iapreview/proyecto/:projectId/calidad", ...manageProject, sugerirAsignacionCalidadIA);
router.post("/iaconfirm/proyecto/:projectId/calidad", ...manageProject, confirmarAsignacionesPorCalidadController);

//Completar asignaciones manuales
router.post("/completar-manual", authAdmin, authorizeAssignmentPayload, completarAsignacionesManualesController);

//Asignar tareas manualmente
router.post("/asignar-manual", authAdmin, authorizeAssignmentPayload, asignarTareaManualController);



export default router;
