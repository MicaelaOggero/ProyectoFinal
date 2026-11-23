import { Router } from "express";
import { authAdmin } from "../../middlewares/auth.js";
import {
  importarDesarrolladores,
  importarHabilidades,
  importarProyectos,
  importarTareas
} from "./import.controller.js";

const router = Router();

router.post("/developers", authAdmin, importarDesarrolladores);
router.post("/skills", authAdmin, importarHabilidades);
router.post("/projects", authAdmin, importarProyectos);
router.post("/tasks", authAdmin, importarTareas);

export default router;
