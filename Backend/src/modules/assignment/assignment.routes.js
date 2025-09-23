import { Router }  from "express";
import { editarAsignacion, getAsignacionesPorProyecto, asignarAutomaticoBasico } from "./assignment.controller.js";

const router = Router();

// Editar asignación existente
router.put("/:asignacionId", editarAsignacion);

// Obtener asignaciones por proyecto
router.get("/proyecto/:proyectoId", getAsignacionesPorProyecto);

// Ruta de asignación automática por proyecto segun disponibilidad y habilidades (básico)
router.post("/asignar-automatico/:projectId", asignarAutomaticoBasico);

export default router;
