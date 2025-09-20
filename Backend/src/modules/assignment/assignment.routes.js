import { Router }  from "express";
import { editarAsignacion, getAsignacionesPorProyecto } from "./assignment.controller.js";

const router = Router();

// Editar asignación existente
router.put("/:asignacionId", editarAsignacion);
router.get("/proyecto/:proyectoId", getAsignacionesPorProyecto);


export default router;
