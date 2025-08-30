import express from "express";
import { crearFeedback, listarFeedbackPorUsuario } from "./performanceFeedback.controller.js";

const router = express.Router();

router.post("/", crearFeedback);
router.get("/usuario/:userId", listarFeedbackPorUsuario);

export default router;
