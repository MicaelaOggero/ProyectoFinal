import express from "express";
import { crearFeedback, listarFeedbackPorUsuario, crearFeedbackMasivoController} from "./performanceFeedback.controller.js";
import { auth, authAdmin } from '../../middlewares/auth.js';
import { authorizeCurrentUser, authorizeCompanyRecords } from '../companies/tenant.auth.js';

const router = express.Router();

router.post("/", authAdmin, authorizeCompanyRecords(req => [req.body]), (req, res, next) => { req.body.administrador = req.user._id; next(); }, crearFeedback);
router.get("/usuario/:userId", auth, authorizeCurrentUser(), listarFeedbackPorUsuario);

// POST /feedback/masivo
router.post("/masivo", authAdmin, authorizeCompanyRecords(req => req.body?.feedbacks), (req, res, next) => { req.body.feedbacks.forEach(item => { item.administrador = req.user._id; }); next(); }, crearFeedbackMasivoController);

export default router;
