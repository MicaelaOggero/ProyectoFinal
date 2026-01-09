//ruta para calcular datos globales de simulacion
import {calcularDatosGlobalesSimulacionController} from "../simulationAssignment/simulationAssignment.controller.js";
import { obtenerPreviewResumenController } from "../simulationAssignment/simulationAssignment.controller.js";
import { Router } from "express";
import { authAdmin } from "../../middlewares/auth.js";

const router = Router();

router.post("/calcular-datos-globales", authAdmin, calcularDatosGlobalesSimulacionController);

router.get("/resumen-simulacion/:projectId", obtenerPreviewResumenController);


export default router;