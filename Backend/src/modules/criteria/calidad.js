import OpenAI from "openai";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import dotenv from "dotenv";
import { obtenerEficienciaHistorica } from "../users/user.service.js";
import Asignacion from "../assignment/assignment.model.js";
import PerformanceFeedback from "../performanceFeedback/performanceFeedback.model.js";

dotenv.config()

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const previewObtenerAsignacionesPorCalidadIA = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Proyecto no encontrado");

    // 🔹 Obtener tareas pendientes y sin desarrollador asignado
    const tareasPendientes = await Task.find({
        proyecto: projectId,
        estado: "pendiente",
    }).populate("proyecto");

    if (!tareasPendientes.length)
        throw new Error("No hay tareas para este proyecto");

    // 🔹 Obtener IDs de tareas que ya están asignadas en la colección Asignacion
    const tareasAsignadas = await Asignacion.find(
        { proyecto: projectId },
        { tarea: 1, _id: 0 }
    ).lean();

    const idsTareasAsignadas = tareasAsignadas.map(a => a.tarea.toString());

    // 🔹 Filtrar tareas que aún NO estén asignadas
    const tareas = tareasPendientes.filter(
        t => !idsTareasAsignadas.includes(t._id.toString())
    );

    if (!tareas.length)
        throw new Error("Todas las tareas del proyecto ya están asignadas");

    // 🔹 Obtener desarrolladores disponibles
    const desarrolladores = await User.find({ rol: "user" });

    const feedbackPorDev = {};
    const feedbacks = await PerformanceFeedback.find().lean();


    feedbacks.forEach(f => {
        const devId = f.desarrollador.toString();
        if (!feedbackPorDev[devId]) feedbackPorDev[devId] = [];
        feedbackPorDev[devId].push({
            proyecto: f.proyecto,
            puntuacion: f.puntuacion,
            comentario: f.comentario,
            fecha: f.fecha
        });
    });

    const tareasData = tareas.map(t => ({
        id: t._id,
        descripcion: t.descripcion,
        fechaInicio: t.fechaEstimadaInicio,
        fechaFin: t.fechaEstimadaFin,
        tiempoEstimadoHoras: t.tiempoEstimadoHoras,
        habilidades: t.habilidadesRequeridas,
        prioridad: t.prioridad,
        nivelDificultad: t.nivelDificultad,
    }));

    // 🔹 Obtener datos de cada dev
    const devsData = await Promise.all(
        desarrolladores.map(async (dev) => {
            const eficienciaPromedio = await obtenerEficienciaHistorica(dev._id);
            const disponibilidad = tareas.map((tarea) => ({
                tareaId: tarea._id,
                diasDisponibles: obtenerDisponibilidadEnRango(
                    dev,
                    tarea.fechaEstimadaInicio,
                    tarea.fechaEstimadaFin
                ),
            }));

            return {
                id: dev._id,
                nombre: dev.nombre,
                experiencia: dev.aniosExperiencia,
                habilidades: dev.habilidades.map((h) => ({
                    nombre: h.nombre,
                    nivel: h.nivel,
                })),
                preferencias: dev.preferencias,
                costoPorHora: dev.costoPorHora,
                eficienciaPromedio,
                disponibilidad,
                preferenciasHabilidad: dev.preferenciasHabilidad,
                preferenciasTarea: dev.preferenciasTarea,
                feedbackHistorico: feedbackPorDev[dev._id.toString()] || []
            };
        })
    );

    // 🧠 Prompt IA
    const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Asignar cada tarea al desarrollador que pueda completarla en el menor tiempo posible y con la mayor calidad,
considerando los siguientes factores:

1. Disponibilidad diaria (horas por fecha)
2. Tiempo estimado de la tarea
3. Experiencia (años)
4. Habilidades técnicas requeridas de la tarea
5. Prioridad y dificultad de la tarea
6. Nivel del desarrollador en las habilidades requeridas
7. Eficiencia histórica del desarrollador
   - eficiencia = 1: estimó 10h, tardó 10h
   - eficiencia > 1: estimó 10h, tardó 8h
   - eficiencia < 1: estimó 10h, tardó 12h
8. Preferencias y feedback histórico de calidad
   - preferenciasHabilidad: puntuación promedio por habilidad (1-5) y veces calificado
   - preferenciasTarea: puntuación promedio por tarea y veces calificado
   - performanceFeedback: puntuación promedio general en proyectos anteriores
9. Preferencias del desarrollador

Reglas de asignación:
- Primero asegura que el desarrollador tenga disponibilidad suficiente para cubrir las horas de la tarea.
- Luego, prioriza la asignación a desarrolladores con mayor puntuación promedio histórica en la habilidad o tarea específica.
- Considera la eficiencia histórica para ajustar tiempos estimados.
- Evita sobrecargar al mismo desarrollador con demasiadas tareas.
- Si varios desarrolladores cumplen los requisitos, usa las preferencias del desarrollador para decidir.
- Cada tarea debe asignarse al desarrollador que ofrezca el mejor balance entre **tiempo y calidad**.

Devuelve un JSON **válido** con la siguiente estructura (Nada más el JSON):

{
  "asignaciones": [
    {
      "tareaId": "ID de la tarea",
      "descripcion": "Descripción de la tarea",
      "desarrolladorId": "ID del desarrollador elegido",
      "nombre": "Nombre del desarrollador elegido",
      "apellido": "Apellido del desarrollador elegido",
      "dias": [
        { "fecha": "YYYY-MM-DDT00:00:00.000Z", "horasAsignadas": 4 }
      ],
      "horasTotales": numero,
      "tipoAsignacion": "calidad",
      "razon": "Explicación detallada de por qué fue asignado, incluyendo calidad y eficiencia"
    }
  ],
  "costoTotalProyecto": "costo total estimado de todas las tareas asignadas"
}

Datos:
${JSON.stringify({ tareas: tareasData, desarrolladores: devsData }, null, 2)}

Notas:
- usa las puntuaciones de preferenciasHabilidad, preferenciasTarea y performanceFeedback para asegurar la calidad
- si un desarrollador tiene alta puntuación en la habilidad requerida, dale prioridad
- si un desarrollador tiene baja eficiencia o puntuación histórica, asígnalo solo si no hay otra opción
`;

    const completion = await client.responses.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        input: prompt,
    });

    let texto = completion.output_text.trim();
    texto = texto.replace(/```json|```/g, "").trim();

    try {
        return JSON.parse(texto);
    } catch (err) {
        console.error("Error parseando JSON de IA:", err, "Texto devuelto:", texto);
        throw new Error("La respuesta de la IA no fue JSON válido");
    }
};

export async function confirmarAsignacionPorCalidad(projectId, asig, costoTProyecto) {
    const resultados = [];

    if (!asig || !Array.isArray(asig)) {
        throw new Error("Formato de sugerencias inválido. Se esperaba un array de asignaciones.");
    }
    

    const asignaciones = asig;
    const costoTotalProyecto = Number(costoTProyecto);

    for (const asignacion of asignaciones) {
        const { tareaId, desarrolladorId, dias, horasTotales, razon } = asignacion;

        const tareaDB = await Task.findById(tareaId);
        const dev = await User.findById(desarrolladorId);
        const proyecto = await Project.findById(projectId);

        if (!tareaDB || !dev || !proyecto) {
            resultados.push({
                tarea: tareaId,
                estado: "error",
                mensaje: "Tarea, desarrollador o proyecto no encontrado",
            });
            continue;
        }

        // 🔹 Actualizar calendario del desarrollador según los días asignados
        for (const dia of dias) {
            const diaISO = new Date(dia.fecha).toISOString().split("T")[0];
            const registro = dev.calendario.find(
                (c) => c.fecha.toISOString().split("T")[0] === diaISO
            );

            if (registro) {
                registro.horasDisponibles -= dia.horasAsignadas;
                if (registro.horasDisponibles < 0) registro.horasDisponibles = 0;
            }
        }
        await dev.save();

        // 🔹 VALIDACIÓN: evitar duplicar asignaciones de la misma tarea
        const existeAsignacion = await Asignacion.findOne({ tarea: tareaId });
        if (existeAsignacion) {
            resultados.push({
                tarea: tareaDB.descripcion,
                estado: "omitida",
                mensaje: `La tarea "${tareaDB.descripcion}" ya está asignada y no puede reasignarse.`,
            });
            continue;
        }

        // 🔹 Crear registro de asignación
        const costoTotal = horasTotales * (dev.costoPorHora || 0);


        await Asignacion.create({
            tarea: tareaDB._id,
            desarrollador: dev._id,
            dias,
            horasTotales,
            proyecto: proyecto._id,
            tipoAsignacion: "calidad",
            razon,
            costoPorHora: dev.costoPorHora,
            costoTotal,
        });



        // 🔹 Actualizar tarea
        tareaDB.desarrolladorAsignado = dev._id;
        await tareaDB.save();

        resultados.push({
            tarea: tareaDB.descripcion,
            desarrollador: `${dev.nombre} ${dev.apellido}`,
            horasTotales,
            costoTotal,
            estado: "ok",
        });
    }

    // 🔹 Actualizar costo total estimado del proyecto
    await Project.findByIdAndUpdate(projectId, { costoTotal: costoTotalProyecto });

    return {
        message: "Asignaciones confirmadas y guardadas en la base de datos (modo calidad)",
        costoTotalProyecto,
        resultados,
    };
    asig
}
