import OpenAI from "openai";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import dotenv from "dotenv";
import { obtenerEficienciaHistorica } from "../users/user.service.js";

dotenv.config()

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const obtenerAsignacionesPorTiempoIA = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Proyecto no encontrado");

    const tareas = await Task.find({
        proyecto: projectId,
        desarrolladorAsignado: null,
        estado: "pendiente",
    }).populate("proyecto");
    const desarrolladores = await User.find({ rol: "user" });

    if (!tareas.length) throw new Error("No hay tareas para este proyecto");

    const tareasData = tareas.map(t => ({
        id: t._id,
        descripcion: t.descripcion,
        fechaInicio: t.fechaEstimadaInicio,
        fechaFin: t.fechaEstimadaFin,
        tiempoEstimadoHoras: t.tiempoEstimadoHoras || 8,
        habilidades: t.habilidadesRequeridas,
        prioridad: t.prioridad,
        nivelDificultad: t.nivelDificultad
    }));

    // Obtenemos los datos completos de cada dev
    const devsData = await Promise.all(desarrolladores.map(async (dev) => {
        // ⚡ Eficiencia promedio histórica
        const eficienciaPromedio = await obtenerEficienciaHistorica(dev._id);

        // Disponibilidad por tarea
        const disponibilidad = tareas.map(tarea => ({
            tareaId: tarea._id,
            diasDisponibles: obtenerDisponibilidadEnRango(dev, tarea.fechaEstimadaInicio, tarea.fechaEstimadaFin)
        }));

        return {
            id: dev._id,
            nombre: dev.nombre,
            experiencia: dev.aniosExperiencia,
            habilidades: dev.habilidades.map(h => ({ nombre: h.nombre, nivel: h.nivel })),
            preferencias: dev.preferencias,
            costoPorHora: dev.costoPorHora,
            eficienciaPromedio,        // 🔹 agregado
            disponibilidad            // 🔹 agregado
        };
    }));


    // 🧠 Nuevo prompt detallado
    const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Asignar cada tarea al desarrollador que pueda completarla en el menor tiempo posible,
considerando:
- Disponibilidad diaria (horas por fecha)
- Tiempo estimado de la tarea
- Experiencia (años)
- Habilidades técnicas requeridas de la tarea
- Prioridad y dificultad de la tarea
- Nivel del desarrollador en las habilidades requeridas
- Eficiencia histórica del desarrollador (
eficiencia = 1	Estimó 10h, tardó 10h
eficiencia > 1	Estimó 10h, tardó 8h
eficiencia < 1	Estimó 10h, tardó 12h)
- Y por ultimo, habiendo considerado todo lo anterior primero, las preferencias del desarrollador

Para cada tarea, elige el desarrollador que cumpla mejor con las habilidades
y tenga disponibilidad suficiente para cubrir las horas requeridas.
Distribuye las horas estimadas dentro del rango de fechas de la tarea. No sobrecargar al mismo usuario con demasiadas tareas.

👉 Devuelve un JSON **válido** y **sin formato markdown** con esta estructura:

[
  {
    "tareaId": "ID de la tarea",
    "descripcion": "Descripción de la tarea",
    "desarrolladorId": "ID del desarrollador elegido",
    "desarrolladorNombre": "Nombre del desarrollador elegido",
    "asignacionHoras": [
      { "fecha": "YYYY-MM-DDT00:00:00.000Z", "horasAsignadas": 4 },
      { "fecha": "YYYY-MM-DDT00:00:00.000Z", "horasAsignadas": 3 }
    ],
    "razon": "Explicación detallada de por qué fue asignado".
    costoEstimado: "costo toal estimado basado el el costo por hora del dev y las horas asignadas"
  }...
  costoTotalProyecto: "costo total estimado de todas las tareas asignadas"
]

Datos:
${JSON.stringify({ tareas: tareasData, desarrolladores: devsData }, null, 2)}
`;

    const completion = await client.responses.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        input: prompt,
    });

    let texto = completion.output_text.trim();

    // 🧹 limpiar posibles bloques markdown
    texto = texto.replace(/```json|```/g, "").trim();

    try {
        return JSON.parse(texto);
    } catch (err) {
        console.error("Error parseando JSON de IA:", err, "Texto devuelto:", texto);
        throw new Error("La respuesta de la IA no fue JSON válido");
    }
};
