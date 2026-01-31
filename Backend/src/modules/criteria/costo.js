import OpenAI from "openai";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import dotenv from "dotenv";
import Asignacion from "../assignment/assignment.model.js";
import { verificarYActualizarCalendario } from "../users/user.service.js";
import { tieneHabilidadesSuficientes } from "../../utils/asignacionBasica/filtroHabilidades.js";
import SimulationAssignment from "../simulationAssignment/simulationAssignment.model.js";
import { ordenarTareas } from "../../utils/asignacionBasica/ordenarTareas.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js";
import { calcularDatosGlobalesSimulacion } from "../simulationAssignment/simulationAssignment.service.js";

dotenv.config()

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const previsualizarAsignacionPorCosto = async (projectId) => {

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Proyecto no encontrado");

  // 🔹 Obtener tareas pendientes y sin asignar
  let tareas = await Task.find({
    proyecto: projectId,
    estado: "pendiente",
    asignada: false
  }).populate("proyecto");

  if (!tareas.length)
    throw new Error("No hay tareas sin asignar para este proyecto");

  // Ordenar tareas por prioridad y dificultad
  tareas = ordenarTareas(tareas);

  // 🔹 Obtener desarrolladores
  let desarrolladores = await User.find({ rol: "user" });

  const candidatosPorTarea = {};
  const devsDataPorTarea = {};

  for (const tarea of tareas) {

    // --- PRIMER FILTRO: habilidades mínimas 50% ---
    const candidatosPorHabilidad = desarrolladores.filter(dev =>
      tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.5)
    );

    // --- SEGUNDO FILTRO: disponibilidad suficiente en el rango de la tarea ---
    const candidatosConDisponibilidad = candidatosPorHabilidad.filter(dev =>
      tieneDisponibilidad(
        dev,
        tarea.fechaEstimadaInicio,
        tarea.fechaEstimadaFin,
        tarea.tiempoEstimadoHoras // horas necesarias para la tarea
      )
    );

    // Guardar info de la tarea y sus candidatos
    const tareaKey = String(tarea._id);

    const tareaInfo = {
      id: tarea._id,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      fechaEstimadaInicio: tarea.fechaEstimadaInicio,
      fechaEstimadaFin: tarea.fechaEstimadaFin,
      habilidadesRequeridas: tarea.habilidadesRequeridas,
      prioridad: tarea.prioridad,
      estimacionHoras: tarea.tiempoEstimadoHoras
    };

    const desarrolladoresCandidatos = await Promise.all(
      (candidatosConDisponibilidad ?? []).map(async (dev) => {
        const diasDisponibles = obtenerDisponibilidadEnRango(
          dev,
          tarea.fechaEstimadaInicio,
          tarea.fechaEstimadaFin
        );

        return {
          id: dev._id,
          nombre: dev.nombre,
          apellido: dev.apellido,

          aniosExperiencia: dev.aniosExperiencia,
          habilidades: dev.habilidades?.map(h => ({
            nombre: h.nombre,
            nivel: h.nivel
          })) ?? [],

          preferenciasHabilidad: dev.preferenciasHabilidad ?? [],
          costoPorHora: dev.costoPorHora,

          rendimientoHistorico: dev.rendimientoHistorico,
          puntuacionPromedioCalidad: dev.puntuacionPromedioCalidad,
          feedbackHistorico: dev.feedbackHistorico,

          diasDisponibles // [{fecha, horasDisponibles}]
        };
      })
    );

    devsDataPorTarea[tareaKey] = {
      tarea: tareaInfo,
      desarrolladoresCandidatos,
      sinCandidatos: desarrolladoresCandidatos.length === 0
    };

    if (desarrolladoresCandidatos.length === 0) {
      console.warn(`⚠️  La tarea "${tarea.descripcion}" no tiene candidatos disponibles.`);
      continue;
    }

    // Guardar lista de candidatos por tarea
    candidatosPorTarea[tareaKey] = desarrolladoresCandidatos;

  }

  // Retornar data completa para todas las tareas (devsDataPorTarea)
  // console.log("Data completa para IA de todas las tareas:");
  // console.log(JSON.stringify(devsDataPorTarea, null, 2));

  const payloadIA = {
    projectId,
    devsDataPorTarea: devsDataPorTarea
  };
  // 🧠 Prompt IA
  const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Teniendo en cuenta que desarrolladoresCandidatos guarda para cada tarea una lista de desarrolladores que pasan los filtros obligatorios, asignar cada tarea a uno de los desarrolladores que esta dentro de cada lista (desarrolladoresCandidatos) según las siguientes reglas de asignación y considerando SOLAMENTE los siguientes factores:
- Disponibilidad de horas por día (diasDisponibles)
- Tiempo estimado de la tarea (estimacionHoras)
- Habilidades requeridas de la tarea (habilidadesRequeridas)
- Habilidades del desarrollador (habilidades)
- Costo por hora del desarrollador (costoPorHora)
- Años de experiencia (aniosExperiencia)
- Preferencias de habilidades (preferenciasHabilidad)

Reglas de asignación:

1) PRIMER FILTRO (OBLIGATORIO)
- Dentro cada lista de desarrolladoresCandidatos (mientras no esté vacía) para cada tarea, seleccionar al que tenga el menor costo por hora (costoPorHora).(NO SELECCIONAR UN DESARROLLADOR QUE NO ESTE EN LA LISTA desarrolladoresCandidatos DE LA TAREA). Si desarrolladoresCandidatos es vacía, no asignar la tarea.

2) SEGUNDO FILTRO - En caso de empate en el costoPorHora de los desarrolladoresCandidatos, elegir teniendo en cuenta la disponibilidad (elegir el que tenga mas disponibilidad), la mejor puntuación promedio en las habilidades requeridas por la tarea, los años de experiencia (aniosExperiencia) y las preferencias de habilidades (preferenciasHabilidad) del desarrollador.

3) MUY IMPORTANTE: solo se deben tener en cuenta para la selección el costo por hora de los desarrolladores y luego (solo en caso de empate en el costoPorHora) los demás factores mencionados al principio. No considerar ninguno de los otros factores como rendimiento histórico, calidad o feedback histórico para la selección del desarrollador.
Es muy importante distribuir las horas de forma uniforme entre los dias disponibles.

Devuelve un JSON **válido** con esta estructura (Nada más que el JSON):
{
  projectId: "ID del proyecto",
  "asignaciones": [
  (si la tarea tuvo desarrolladoresCandidatos)
    {
      "tareaId": "ID de la tarea",
      "descripcion": "Descripción de la tarea",
      "desarrolladorId": "ID del desarrollador elegido",
      "nombre": "Nombre del desarrollador elegido",
      "apellido": "Apellido del desarrollador elegido",
      "dias": [
        { "fecha": "YYYY-MM-DDT00:00:00.000Z", "horasAsignadas": 4 }
      ], si o si debe estar lleno con la distribución de horas asignadas por día si la tarea fue asignada
      "horasTotales": numero,
      "tipoAsignacion": "costo",
      "razon": "Explicación detallada de por qué fue asignado o no",
      "costoTotal": "costo total de la tarea según horas y costo por hora del dev seleccionado",
      "rendimientoHistorico": {
        "promedioPorcentaje": numero,
        "tareasCompletadas": numero
      }, (del dev elegido)
      "horasEstimadasSegunRendimiento": "resultado del calculo = horasTotales * (100 / rendimientoHistorico.promedioPorcentaje), redondeado a 2 decimales || horasTotales si no hay rendimientoHistorico",
      "calidadTarea": "puntuacionPromedioCalidad.puntuacionPromedio (del dev elegido)",
      "feedbackHistorico": "feedbackHistorico.puntuacionPromedio (del dev elegido)" 
    },
  (si la tarea NO tuvo desarrolladoresCandidatos)
    {
      tareaId: tarea._id,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      fechaEstimadaInicio: tarea.fechaEstimadaInicio,
      fechaEstimadaFin: tarea.fechaEstimadaFin,
      habilidadesRequeridas: tarea.habilidadesRequeridas,
      prioridad: tarea.prioridad,
      estimacionHoras: tarea.horasTotales,
      sinCandidatos: true
    }
  ]
}

Datos:
${JSON.stringify(payloadIA, null, 2)}
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

import { asignarTareaManual } from "../assignment/assignment.service.js";

/**
 * resultadoIA: el JSON que te devuelve la IA, del estilo:
 * { asignaciones: [ ... ] }
 *
 * asignarTareaManualFn: función que vos implementás,
 * que recibe una asignación "sinCandidatos"
 * y devuelve un objeto con los datos del dev y la planificación manual.
 */
export async function completarAsignacionesManuales(resultadoIA) {
  const nuevasAsignaciones = [];

  for (const asignacion of resultadoIA.asignaciones) {
    // Si ya tiene desarrollador asignado por la IA, la dejamos como está
    if (!asignacion.sinCandidatos) {
      nuevasAsignaciones.push(asignacion);
      continue;
    }

    //agregar a asignacion un desarrolladorId antes de llamar a la función
    asignacion.desarrolladorId = "692887c28e8c635a505b80d6";

    // Si la tarea no tenía candidatos (caso sinCandidatos: true)
    // llamamos a la función que permite asignarla manualmente
    const asignacionManual = await asignarTareaManual(asignacion);

    // Si el usuario no asignó nadie (null/undefined), la dejamos tal cual
    if (!asignacionManual) {
      nuevasAsignaciones.push(asignacion);
      continue;
    }

    // Armamos la nueva asignación, copiando los datos de la tarea
    // y completando con la info del dev elegido manualmente
    const asignacionCompletada = {
      tareaId: asignacionManual.tareaId,
      descripcion: asignacionManual.descripcion,
      nombre: asignacionManual.nombre,
      apellido: asignacionManual.apellido,              // tareaId, descripcion, etc.
      tipoAsignacion: asignacionManual.tipoAsignacion,     // marcamos que fue manual

      desarrolladorId: asignacionManual.desarrolladorId,
      nombre: asignacionManual.nombre,
      apellido: asignacionManual.apellido,

      rendimientoHistorico: asignacionManual.rendimientoHistorico,
      dias: asignacionManual.dias,                  // [{ fecha, horasAsignadas }]
      horasTotales: asignacionManual.horasTotales,
      costoTotal: asignacionManual.costoTotal,
      porcentajeRendimiento: asignacionManual.porcentajeRendimiento,
      horasEstimadasSegunRendimiento: asignacionManual.horasEstimadasSegunRendimiento,
      calidadTarea: asignacionManual.calidadTarea,
      feedbackHistorico: asignacionManual.feedbackHistorico,

      razon: `${asignacionManual.razon} `
    };

    nuevasAsignaciones.push(asignacionCompletada);
  }


  // 🔹 AQUÍ devolvemos un JSON COMPLETO y FINAL
  const resultadoFinal = {
    projectId: resultadoIA.projectId,
    asignaciones: nuevasAsignaciones
  };

  const resultadoFinalConDatosGlobales = {
    ...resultadoFinal,
    ...calcularDatosGlobalesSimulacion(resultadoFinal)
  };

  return resultadoFinalConDatosGlobales;

}

export async function confirmarAsignacionPorCosto(projectId, sugerencias) {
  const resultados = [];
  const idsAsignacionesCreadas = [];

  // 0) Validar que haya projectId
  if (!projectId) {
    throw new Error("Falta projectId para confirmar la asignación.");
  }

  // ✅ Validar estructura básica de sugerencias
  if (!sugerencias || !Array.isArray(sugerencias.asignaciones)) {
    throw new Error(
      "Formato de sugerencias inválido. Se esperaba un objeto con la propiedad 'asignaciones' (array)."
    );
  }

  const asignaciones = sugerencias.asignaciones;

  // ✅ Mapear nombres desde tu JSON real
  const {
    costoTotalSimulado,     // número total del proyecto
    tiempoTotalEstimado,    // puede venir null
    tiempoTotalSimulado,    // total simulado
    calidadPromedioTareas,
    calidadPromedioSimulado,
    criterio
  } = sugerencias;

  // 2) PRE-VALIDACIÓN GLOBAL (antes de tocar la BD)
  const errores = [];

  // 2.1) Validar que haya al menos una asignación
  if (!asignaciones.length) {
    errores.push("No hay asignaciones para confirmar.");
  }

  // 2.2) Validar que los agregados globales estén presentes y sean números
  const camposGlobales = [
    { nombre: "costoTotalSimulado", valor: costoTotalSimulado },
    { nombre: "tiempoTotalEstimado", valor: tiempoTotalEstimado },
    { nombre: "tiempoTotalSimulado", valor: tiempoTotalSimulado },
    { nombre: "calidadPromedioTareas", valor: calidadPromedioTareas },
    { nombre: "calidadPromedioSimulado", valor: calidadPromedioSimulado },
  ];

  for (const campo of camposGlobales) {
    if (campo.valor == null || Number.isNaN(Number(campo.valor))) {
      errores.push(`El dato global "${campo.nombre}" es requerido y debe ser numérico.`);
    }
  }

  // 2.3) Validar cada asignación
  for (const [index, asignacion] of asignaciones.entries()) {
    const path = `asignaciones[${index}]`;

    if (!asignacion.tareaId) {
      errores.push(`${path}: falta "tareaId".`);
    }

    if (!asignacion.desarrolladorId) {
      errores.push(`${path}: falta "desarrolladorId".`);
    }

    if (!Array.isArray(asignacion.dias) || asignacion.dias.length === 0) {
      errores.push(`${path}: "dias" debe ser un array con al menos un elemento.`);
    }

    if (asignacion.horasTotales == null || Number.isNaN(Number(asignacion.horasTotales))) {
      errores.push(`${path}: "horasTotales" es requerido y debe ser numérico.`);
    }

    if (asignacion.costoTotal == null || Number.isNaN(Number(asignacion.costoTotal))) {
      errores.push(`${path}: "costoTotal" es requerido y debe ser numérico.`);
    }

    if (asignacion.rendimientoHistorico.promedioPorcentaje == null ||
      Number.isNaN(Number(asignacion.rendimientoHistorico.promedioPorcentaje))
    ) {
      errores.push(
        `${path}: "rendimientoHistorico.promedioPorcentaje" es requerido y debe ser numérico.`
      );
    }


    if (asignacion.horasEstimadasSegunRendimiento == null ||
      Number.isNaN(Number(asignacion.horasEstimadasSegunRendimiento))) {
      errores.push(`${path}: "horasEstimadasSegunRendimiento" es requerido y debe ser numérico.`);
    }
  }

  // 2.4) Si hubo errores → NO confirmamos nada
  if (errores.length > 0) {
    // Podés devolver el array de errores para mostrarlos en front
    throw new Error(
      "No se puede confirmar la simulación porque faltan datos o hay datos inválidos:\n" +
      errores.join("\n")
    );
  }

  // 🔻🔻🔻 A PARTIR DE ACÁ recién tocamos la BD 🔻🔻🔻


  for (const asignacion of asignaciones) {
    const {
      tareaId,
      desarrolladorId,
      dias,
      horasTotales,
      razon,
      porcentajeRendimiento,
      horasEstimadasSegunRendimiento, // 👈 nombre real en tu JSON
      calidadTarea,
      feedbackHistorico,
      costoTotal
    } = asignacion;

    // ❌ NO PROCESAR ASIGNACIÓN SIN DÍAS
    if (!dias || dias.length === 0) {
      resultados.push({
        tarea: tareaId,
        estado: "omitida",
        mensaje:
          "No se creó la asignación porque no hay días asignados (sin disponibilidad)."
      });
      continue;
    }

    const tareaDB = await Task.findById(tareaId);
    const dev = await User.findById(desarrolladorId);
    const proyecto = await Project.findById(projectId);

    if (!tareaDB || !dev || !proyecto) {
      resultados.push({
        tarea: tareaId,
        estado: "error",
        mensaje: "Tarea, desarrollador o proyecto no encontrado"
      });
      continue;
    }

    // ✅ Actualizar calendario del dev
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

    // ✅ Evitar duplicar asignaciones
    const existeAsignacion = await Asignacion.findOne({ tarea: tareaId });
    if (existeAsignacion) {
      resultados.push({
        tarea: tareaDB.descripcion,
        estado: "omitida",
        mensaje: `La tarea "${tareaDB.descripcion}" ya está asignada.`
      });
      continue;
    }

    // 🧠 Normalizar feedbackHistorico: puede ser número o { puntuacionPromedio }
    let feedbackHistoricoNormalizado = null;
    if (typeof feedbackHistorico === "number") {
      feedbackHistoricoNormalizado = feedbackHistorico;
    } else if (
      feedbackHistorico &&
      typeof feedbackHistorico.puntuacionPromedio === "number"
    ) {
      feedbackHistoricoNormalizado = feedbackHistorico.puntuacionPromedio;
    }

    // 💰 Normalizar costoTotal (puede venir como string "96" o número)
    const costoTotalNumber = Number(costoTotal) || 0;

    // 🕒 Normalizar horasEstimadasReales desde horasEstimadasSegunRendimiento
    const horasEstimadasReales =
      horasEstimadasSegunRendimiento != null
        ? Number(horasEstimadasSegunRendimiento)
        : null;

    // ✅ Crear asignación con toda la data simulada
    const nuevaAsignacion = await Asignacion.create({
      tarea: tareaDB._id,
      desarrollador: dev._id,
      dias,
      horasTotales,
      proyecto: proyecto._id,
      tipoAsignacion: "costo",
      razon,

      // costo
      costoPorHora: dev.costoPorHora,
      costoTotal: costoTotalNumber,

      // tiempo
      porcentajeRendimiento,
      horasEstimadasReales,

      // calidad
      puntuacionCalidad: calidadTarea,
      feedbackHistorico: feedbackHistoricoNormalizado
    });

    idsAsignacionesCreadas.push(nuevaAsignacion._id);

    // ✅ Actualizar tarea
    tareaDB.desarrolladorAsignado = dev._id;
    tareaDB.asignada = true;
    await tareaDB.save();

    resultados.push({
      tarea: tareaDB.descripcion,
      desarrollador: `${dev.nombre} ${dev.apellido}`,
      horasTotales,
      costoTotal: costoTotalNumber,
      estado: "ok"
    });
  }

  // ✅ Actualizar costo total del proyecto según la simulación
  if (costoTotalSimulado != null) {
    await Project.findByIdAndUpdate(projectId, {
      costoTotal: costoTotalSimulado
    });
  }

  // ✅ Guardar simulación completa en SimulationAssignment
  await SimulationAssignment.create({
    proyecto: projectId,
    criterio: criterio,
    asignaciones: idsAsignacionesCreadas,
    costoTotalSimulado: costoTotalSimulado ?? 0,
    tiempoTotalSimulado: tiempoTotalSimulado ?? 0,
    tiempoTotalEstimado: tiempoTotalEstimado ?? 0,
    calidadPromedioTareas: calidadPromedioTareas ?? 0,
    calidadPromedioSimulado: calidadPromedioSimulado ?? 0
  });

  return {
    message: "Asignaciones confirmadas y simulación guardada (criterio costo).",
    resultados
  };
}


