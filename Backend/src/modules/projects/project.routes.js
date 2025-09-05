// src/modules/projects/project.routes.js
import { Router } from "express";
import { auth, authAdmin, authToken } from "../../middlewares/auth.js";
import * as projectController from "./project.controller.js";

const router = Router();

// Obtener proyectos (solo admins, solo los que crearon)
router.get("/", authToken, projectController.getProjects);

// Obtener un proyecto específico por ID
router.get("/:id", authAdmin, projectController.getProjectById);

// Crear un nuevo proyecto (solo admins)
router.post("/", authAdmin, projectController.createProject);

// Actualizar un proyecto por ID (solo admins)
router.put("/:id", authAdmin, projectController.updateProject);

// Eliminar un proyecto por ID (solo admins)
router.delete("/:id", authAdmin, projectController.deleteProject);

export default router;
