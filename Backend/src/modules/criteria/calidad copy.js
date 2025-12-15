import OpenAI from "openai";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import dotenv from "dotenv";
import Asignacion from "../assignment/assignment.model.js";
import { verificarYActualizarCalendario } from "../users/user.service.js";
import PerformanceFeedback from "../performanceFeedback/performanceFeedback.model.js";
import { buscarDesarrolladoresSimilares} from "../task/task.service.js"
import { getFeedbackByUser } from "../performanceFeedback/performanceFeedback.service.js";
import { getTaskLogsByDeveloper } from "../task/task.service.js";
import SimulationAssignment from "../simulationAssignment/simulationAssignment.model.js";
import { ordenarTareas } from "../../utils/asignacionBasica/ordenarTareas.js";

dotenv.config()

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const previewObtenerAsignacionesPorCalidadIA = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Proyecto no encontrado");

    // 🔹 Obtener tareas pendientes y sin asignar
    let tareas = await Task.find({
        proyecto: projectId,
        estado: "pendiente",
        asignada: false
    }).populate("proyecto");

    if (!tareas.length)
        throw new Error("No hay tareas para este proyecto");

    // Ordenar tareas por prioridad y dificultad
    tareas = ordenarTareas(tareasPendientes);

    // 🔹 Obtener desarrolladores disponibles
    let desarrolladores = await User.find({ rol: "user" });

    /* const feedbackPorDev = {};
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
    }); */

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


    const candidatosPorTarea = {};
    const devsDataPorTarea = {};

    // 🔹 Obtener datos de cada dev
    const devsData = await Promise.all(
        desarrolladores.map(async (dev) => {
            
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
                apellido: dev.apellido,
                experiencia: dev.aniosExperiencia,
                habilidades: dev.habilidades.map((h) => ({
                    nombre: h.nombre,
                    nivel: h.nivel,
                })),
                preferencias: dev.preferencias,
                costoPorHora: dev.costoPorHora,
                disponibilidad,
                preferenciasHabilidad: dev.preferenciasHabilidad,
                preferenciasTarea: dev.preferenciasTarea,
                feedbackHistorico: feedbackPorDev[dev._id.toString()] || []
            };
        })
    );

    const devsDisponibles = devsData.map(d => d.id);

    // 2️⃣ Lista donde guardaremos los resultados
  const recomendaciones = [];

  // 3️⃣ Recorrer tareas y obtener los mejores devs
  for (const tarea of tareasPendientes) {
    const devsSimilares = await buscarDesarrolladoresSimilares(tarea._id, devsDisponibles);

    // Solo guardar los top 3 (por ejemplo)
    const topDevs = devsSimilares.slice(0, 3);

    recomendaciones.push({
      tareaId: tarea._id,
      nombreTarea: tarea.nombre,
      categoria: tarea.categoria,
      dificultad: tarea.dificultad,
      habilidades: tarea.habilidadesRequeridas,
      candidatos: topDevs.map((d) => ({
        devId: d.devId,
        nombre: d.nombre,
        similitud: d.similitudPromedio,
        puntuacion: d.puntuacionPromedio,
      })),
    });
  }


    // 🧠 Prompt IA
    const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Asignar cada tarea al desarrollador que pueda completarla con la mayor calidad posible,
considerando los siguientes factores:

1. Disponibilidad diaria (horas por fecha)
2. Tiempo estimado de la tarea
3. Experiencia (años)
4. Habilidades técnicas requeridas de la tarea
5. Prioridad y dificultad de la tarea
6. Nivel del desarrollador en las habilidades requeridas
7. Similitud y promedio de puntuación según recomendaciones previas (topDevs)
7. PerformanceFeedback: puntuación promedio general en proyectos anteriores como calidad
8. PreferenciasHabilidad: puntuación promedio por habilidad (1-5) y veces calificado

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
      "razon": "Explicación detallada de por qué fue asignado, incluyendo calidad y eficiencia",
      "costoTotal": "costo total de la tarea según horas y costo por hora",
      "porcentajeRendimiento": "rendimientoHistorico.promedioPorcentaje del dev seleccionado",
      "horasEstimadasReales": "resultado del calculo = tiempoEstimadoHoras * (rendimientoHistorico.promedioPorcentaje / 100), redondeado a 2 decimales",
      "calidadTarea": "puntuacion promedio segun los TaskLog (puntuacionPromedio) de tareas similares del dev seleccionado",
      "feedbackHistorico": {
        "puntuacionPromedio": numero,
        "vecesCalificado": numero
      } (del dev elegido) según PerformanceFeedback de proyectos previos
    }
  ],
    "costoTotalProyecto": "costo total de todas las tareas asignadas según horas y costo por hora"
    "tiempoTotalEstimadoRealProyecto": "tiempo que se estima va demorarse completar todas las tareas en horas (suma de horasEstimadasReales de todas las tareas), redondeado a 2 decimales"
    "tiempoTotalAsignadoProyecto": "tiempo total en horas que se asignó a los desarrolladores para completar las tareas segun tiempoEstimadoHoras"
    "calidadPromedioTareas": "promedio de las puntuaciones históricas de calidad de los devs seleccionados (calidadTarea)",
    "calidadPromedioProyecto": "promedio de los feedbackHistorico de todos los desarrolladores asignados"
  }

Datos:
${JSON.stringify({ tareas: tareasData, desarrolladores: devsData , devsRecomendados: recomendaciones}, null, 2)}

Reglas de asignación:
- Es requisito minimo indispensable que el desarrollador cumpla con al menos el 50% de las habilidades requeridas por la tarea, priorizando aquellos que cumplen con más habilidades
- Es requisito minimo indispensable que el desarrollador tenga disponibilidad suficiente en su calendario para completar la tarea en el rango de fechas estimado
- Selecciona al desarrollador con mejor similitud: d.similitudPromedio, puntuacion: d.puntuacionPromedio del topDevs para cada tarea
- Si los desarrolladores tienen la misma similitud y puntuación, tene en cuenta el feedbackHistorico para decidir, es decir, prioriza a quien tenga mejor feedbackHistorico (puntuacionPromedio y vecesCalificado)
- Distribuye las horas de manera uniforme según la disponibilidad
- Calcula el costo total de cada tarea y del proyecto según las horas asignadas y el costo por hora del desarrollador
- Si no hay desarrollador disponible para una tarea (si no cumple con los requisitos minimos), omítela (mostrar en la razón por qué no se asignó)
- Si varios desarrolladores cumplen los requisitos, usa las preferencias del desarrollador para decidir.
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
        await verificarYActualizarCalendario(dev);
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
        tareaDB.asignada = true;
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
    
}
