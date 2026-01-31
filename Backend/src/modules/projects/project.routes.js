// src/modules/projects/project.routes.js
import { Router } from "express";
import { auth, authAdmin, authToken } from "../../middlewares/auth.js";
import * as projectController from "./project.controller.js";

const router = Router();

// Crear un nuevo proyecto (solo admins)
router.post("/", authAdmin, projectController.createProject);

// Obtener proyectos (solo admins, solo los que crearon)
router.get("/", auth, projectController.getProjects);

// Obtener un proyecto específico por ID
router.get("/:id", authAdmin, projectController.getProjectById);

// Actualizar un proyecto por ID (solo admins)
router.put("/:id", authAdmin, projectController.updateProject);

// Eliminar un proyecto por ID (solo admins)
router.delete("/:id", authAdmin, projectController.deleteProject);

// Iniciar un proyecto
router.put("/:projectId/iniciar", authAdmin, projectController.iniciarProyecto);

// Pausar un proyecto
router.put("/:projectId/pausar",authAdmin, projectController.pausarProyecto);

// Finalizar un proyecto
router.put("/:projectId/finalizar", authAdmin, projectController.finalizarProyecto);

// Calificar desarrolladores del proyecto

router.post("/:projectId/feedback", authAdmin, projectController.calificarDesarrolladoresProyectoController);


export default router;
