// src/modules/projects/project.routes.js
import { Router } from "express";
import { auth, authAdmin, authToken } from "../../middlewares/auth.js";
import * as projectController from "./project.controller.js";
import { authorizeCurrentProject } from '../companies/tenant.auth.js';

const router = Router();

// Crear un nuevo proyecto (solo admins)
router.post("/", authAdmin, projectController.createProject);

// Obtener proyectos (solo admins, solo los que crearon)
router.get("/", auth, projectController.getProjects);

// Obtener un proyecto específico por ID
router.get("/:id", auth, authorizeCurrentProject('id'), projectController.getProjectById);

// Actualizar un proyecto por ID (solo admins)
router.put("/:id", authAdmin, authorizeCurrentProject('id', { adminOnly: true }), projectController.updateProject);

// GeneraciÃ³n de tareas con IA: preview y confirmaciÃ³n
router.post("/:projectId/tasks-ai/preview", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), projectController.previewTasksWithAI);
router.post("/:projectId/tasks-ai/confirm", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), projectController.confirmTasksWithAI);

// Eliminar un proyecto por ID (solo admins)
router.delete("/:id", authAdmin, authorizeCurrentProject('id', { adminOnly: true }), projectController.deleteProject);

// Iniciar un proyecto
router.put("/:projectId/iniciar", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), projectController.iniciarProyecto);

// Pausar un proyecto
router.put("/:projectId/pausar",authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), projectController.pausarProyecto);

// Finalizar un proyecto
router.put("/:projectId/finalizar", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), projectController.finalizarProyecto);

// Calificar desarrolladores del proyecto

router.post("/:projectId/feedback", authAdmin, authorizeCurrentProject('projectId', { adminOnly: true }), projectController.calificarDesarrolladoresProyectoController);


export default router;
