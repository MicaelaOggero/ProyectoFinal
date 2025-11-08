import OpenAI from "openai";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import dotenv from "dotenv";
import Asignacion from "../assignment/assignment.model.js";

dotenv.config()

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const previewObtenerAsignacionesPorTiempoIA = async (projectId) => {
  
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
        rendimientoHistorico: dev.rendimientoHistorico,
        disponibilidad,
      };
    })
  );

  // 🧠 Prompt IA
  const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Asignar cada tarea al desarrollador que pueda completarla en el menor tiempo posible,
considerando:
- Disponibilidad diaria (horas por fecha)
- Tiempo estimado de la tarea (tiempoEstimadoHoras)
- Experiencia (años)
- Habilidades técnicas requeridas de la tarea
- Prioridad y dificultad de la tarea
- Nivel del desarrollador en las habilidades requeridas
- Rendimiento histórico del desarrollador (rendimientoHistorico)
- Y por último, las preferencias del desarrollador

Devuelve un JSON **válido** con esta estructura (Nada más que el JSON):
{
  "asignaciones": [
    {
      "tareaId": "ID de la tarea",
      "descripcion": "Descripción de la tarea",
      "desarrolladorId": "ID del desarrollador elegido",
      "nombre": "Nombre del desarrollador elegido",
      "apellido": "Apellido del desarrollador elegido",
      "rendimientoHistorico": {
        "promedioPorcentaje": numero,
        "tareasCompletadas": numero
      }, (del dev elegido)
      "dias": [
        { "fecha": "YYYY-MM-DDT00:00:00.000Z", "horasAsignadas": 4 }
      ],
      "horasTotales": numero,
      "tipoAsignacion": "tiempo",
      "razon": "Explicación detallada de por qué fue asignado",
      "costoTotal": "costo total de la tarea según horas y costo por hora"
      "porcentajeRendimiento": "rendimientoHistorico.promedioPorcentaje del dev seleccionado"
      "horasEstimadasReales": "resultado del calculo = tiempoEstimadoHoras * (rendimientoHistorico.promedioPorcentaje / 100)"
    }
  ],
  "costoTotalProyecto": "costo total de todas las tareas asignadas según horas y costo por hora"
  "tiempoTotalEstimadoRealProyecto": "tiempo que se estima va demorarse completar todas las tareas en horas (suma de horasEstimadasReales de todas las tareas)"
}

Datos:
${JSON.stringify({ tareas: tareasData, desarrolladores: devsData }, null, 2)}

- Es requisito minimo indispensable que el desarrollador cumpla con al menos el 50% de las habilidades requeridas por la tarea, priorizando aquellos que cumplen con más habilidades
- Es requisito minimo indispensable que el desarrollador tenga disponibilidad suficiente en su calendario para completar la tarea en el rango de fechas estimado
- Es muy importante que selecciones primero a los desarrolladores con mejor rendimiento histórico, es decir en orden descendente según rendimientoHistorico.promedioPorcentaje
- Distribuye las horas de manera uniforme según la disponibilidad
- Si no hay desarrollador disponible para una tarea, omítela (mostrar en la razón que no hay disponibilidad y por qué)
- Calcula el costo total de cada tarea y del proyecto según las horas asignadas y el costo por hora del desarrollador
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

export async function confirmarAsignacionPorTiempo(projectId, sugerencias) {
  const resultados = [];

  if (!sugerencias || !Array.isArray(sugerencias.asignaciones)) {
    throw new Error("Formato de sugerencias inválido. Se esperaba un array de asignaciones.");
  }

  const asignaciones = sugerencias.asignaciones;
  const costoTotalProyecto = Number(sugerencias.costoTotalProyecto);

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
      tipoAsignacion: "tiempo",
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
    message: "Asignaciones confirmadas y guardadas en la base de datos (modo tiempo)",
    costoTotalProyecto,
    resultados,
  };
}
