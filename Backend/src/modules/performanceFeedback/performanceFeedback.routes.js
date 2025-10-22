import express from "express";
import { crearFeedback, listarFeedbackPorUsuario, crearFeedbackMasivoController} from "./performanceFeedback.controller.js";

const router = express.Router();

router.post("/", crearFeedback);
router.get("/usuario/:userId", listarFeedbackPorUsuario);

// POST /feedback/masivo
router.post("/masivo", crearFeedbackMasivoController);

export default router;
