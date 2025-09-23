import { Router }  from "express";
import { editarAsignacion, getAsignacionesPorProyecto } from "./assignment.controller.js";

const router = Router();

// Editar asignación existente
router.put("/:asignacionId", editarAsignacion);

// Obtener asignaciones por proyecto
router.get("/proyecto/:proyectoId", getAsignacionesPorProyecto);


export default router;
