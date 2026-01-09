import { Router } from "express";
import { editarAsignacion, getAsignacionesPorProyecto, previsualizarAsignacionCosto, previewAsignacionBasica, confirmAsignacionBasica, confirmarAsignacionPorCostoController, asignarTareaManualController } from "./assignment.controller.js";
import { sugerirAsignacionTiempoIA, confirmarAsignacionesPorTiempoController, sugerirAsignacionCalidadIA, confirmarAsignacionesPorCalidadController } from "../assignment/assignment.controller.js";
import { completarAsignacionesManualesController } from "../assignment/assignment.controller.js";
import { authAdmin } from "../../middlewares/auth.js";
const router = Router();

// Editar asignación existente
router.put("/:asignacionId", authAdmin, editarAsignacion); //authAdmin,

// Obtener asignaciones por proyecto
router.get("/proyecto/:proyectoId", getAsignacionesPorProyecto); //authAdmin,

// 🔹 Asignación básica
router.get("/iapreview/proyecto/:projectId/basica", previewAsignacionBasica);
router.post("/iaconfirm/proyecto/:projectId/basica", confirmAsignacionBasica);

// 🔹 Asignación por costo
router.get("/iapreview/proyecto/:projectId/costo", previsualizarAsignacionCosto);
router.post("/iaconfirm/proyecto/:projectId/costo", confirmarAsignacionPorCostoController);

// 🔹 Asignación tiempo
router.get("/iapreview/proyecto/:projectId/tiempo", sugerirAsignacionTiempoIA);
router.post("/iaconfirm/proyecto/:projectId/tiempo", confirmarAsignacionesPorTiempoController);

// 🔹 Asignación calidad
router.get("/iapreview/proyecto/:projectId/calidad", sugerirAsignacionCalidadIA);
router.post("/iaconfirm/proyecto/:projectId/calidad", confirmarAsignacionesPorCalidadController);

//Completar asignaciones manuales
router.post("/completar-manual", completarAsignacionesManualesController); //authAdmin,

//Asignar tareas manualmente
router.post("/asignar-manual", asignarTareaManualController); //authAdmin,



export default router;
