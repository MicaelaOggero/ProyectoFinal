import { Router } from "express";
import { editarAsignacion, getAsignacionesPorProyecto, asignarAutomaticoBasico, asignarPorCosto, previsualizarAsignacionCosto, confirmarAsignacionCosto, previewAsignacionBasica, confirmAsignacionBasica } from "./assignment.controller.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { sugerirAsignacionTiempoIA, confirmarAsignacionesPorTiempoController, sugerirAsignacionCalidadIA, confirmarAsignacionesPorCalidadController } from "../assignment/assignment.controller.js";

const router = Router();

// Editar asignación existente
router.put("/:asignacionId", authAdmin, editarAsignacion); //authAdmin,

// Obtener asignaciones por proyecto
router.get("/proyecto/:proyectoId", getAsignacionesPorProyecto); //authAdmin,

// Ruta de asignación automática por proyecto segun disponibilidad y habilidades (básico)
router.post("/asignar-automatico/:projectId", asignarAutomaticoBasico); //authAdmin,

// Asignación automática por costo
router.post("/asignar-costo/:projectId", asignarPorCosto);

// 🔹 Asignación por costo
router.get("/preview/costo/:projectId", previsualizarAsignacionCosto);
router.post("/confirm/costo/:projectId", confirmarAsignacionCosto);

// 🔹 Asignación básica
router.get("/iapreview/proyecto/:projectId/basica", previewAsignacionBasica);
router.post("/confirm/basica/:projectId", confirmAsignacionBasica);

// 🔹 Asignación tiempo
// Previsualizar asignación automática con IA según criterio de tiempo
router.get("/iapreview/proyecto/:projectId/tiempo", sugerirAsignacionTiempoIA);

// Confirmar asignación automática con IA según criterio de tiempo
router.post("/iaconfirm/proyecto/:projectId/tiempo", confirmarAsignacionesPorTiempoController);

// 🔹 Asignación calidad
// Previsualizar asignación automática con IA según criterio de calidad
router.get("/iapreview/proyecto/:projectId/calidad", sugerirAsignacionCalidadIA);

// Confirmar asignación automática con IA según criterio de calidad
router.post("/iaconfirm/proyecto/:projectId/calidad", confirmarAsignacionesPorCalidadController);

// Asignación con AI
import OpenAI from "openai";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import { authAdmin } from "../../middlewares/auth.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extraerJSON(texto) {
  const regex = /```json([\s\S]*?)```/i;  // busca ```json ... ```
  const match = texto.match(regex);
  if (match) return match[1].trim();       // devuelve el contenido interno
  return texto.trim();                     // si no hay bloque, devuelve tal cual
}

// 🔹 Sugerencia IA por proyecto
router.get("/ia/proyecto/:projectId", async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // 1️⃣ Buscar todas las tareas pendientes del proyecto
        const tareas = await Task.find({ proyecto: projectId, estado: "pendiente" })
            .lean();

        if (!tareas.length) {
            return res.status(404).json({ mensaje: "No hay tareas pendientes para este proyecto" });
        }

        // 2️⃣ Buscar todos los desarrolladores
        const users = await User.find({ rol: "user" }).lean();

        // 3️⃣ Preparar datos resumidos para la IA
        const usuariosFiltrados = users.map(dev => {
            return {
                id: dev._id,
                nombre: dev.nombre,
                experiencia: dev.aniosExperiencia,
                habilidades: dev.habilidades.map(h => ({ nombre: h.nombre, nivel: h.nivel })),
                preferencias: dev.preferencias,
                disponibilidad: tareas.map(tarea => ({
                    tareaId: tarea._id,
                    diasDisponibles: obtenerDisponibilidadEnRango(dev, tarea.fechaEstimadaInicio, tarea.fechaEstimadaFin)
                }))
            };
        });

        // 4️⃣ Preparar prompt para la IA
        const prompt = {
            tareas,
            usuarios: usuariosFiltrados
        };

        // 5️⃣ Llamar a la IA
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
            Sos un agente asignador de tareas.
            Analizá las tareas de un proyecto y sugerí qué desarrollador debería realizar cada una
            para lograr la mayor eficiencia y menor tiempo de entrega.
            Considerá:
            - habilidades requeridas vs. habilidades del usuario
            - disponibilidad horaria (solo los días dentro del rango de la tarea)
            - experiencia total y en tecnologías similares
            - nivel de dificultad y prioridad de la tarea
            - no sobrecargar al mismo usuario con demasiadas tareas
            Devolvé un JSON con una lista de asignaciones recomendadas:
            [
              { "tarea": "descripcion", "mejorCandidato": "nombre", "razon": "..." }
            ]
          `
                },
                { role: "user", content: JSON.stringify(prompt) }
            ],
            temperature: 0.3
        });

        // 6️⃣ Parsear respuesta
        const raw = response.choices[0].message.content;
        let resultado;
        try {
            const jsonLimpio = extraerJSON(raw);
            resultado = JSON.parse(jsonLimpio);
        } catch (e) {
            console.error("Error parseando JSON de IA:", e, "Texto devuelto:", raw);
            return res.status(500).json({ error: "Error al parsear la respuesta de la IA" });
        }

        res.json({
            proyecto: projectId,
            asignacionesSugeridas: resultado
        });

    } catch (error) {
        console.error("Error en /ia/proyecto:", error);
        res.status(500).json({ error: "Error al generar sugerencia de asignación" });
    }
});

export default router;
