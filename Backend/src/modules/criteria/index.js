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

dotenv.config()

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const previsualizarAsignacionBasica = async (projectId) => {

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

    /* console.log("Candidatos que pasan filtro de habilidades:");
    console.log(JSON.stringify(
      candidatosPorHabilidad.map(d => ({
        id: d._id,
        nombre: d.nombre,
        habilidades: d.habilidades
      })), 
      null, 
      2
    )); */

    // --- SEGUNDO FILTRO: disponibilidad suficiente en el rango de la tarea ---
    const candidatosConDisponibilidad = candidatosPorHabilidad.filter(dev =>
      tieneDisponibilidad(
        dev,
        tarea.fechaEstimadaInicio,
        tarea.fechaEstimadaFin,
        tarea.tiempoEstimadoHoras // horas necesarias para la tarea
      )
    );

    /* console.log("Candidatos que pasan filtro de disponibilidad:");
    console.log(JSON.stringify(
      candidatosConDisponibilidad.map(d => ({
        id: d._id,
        nombre: d.nombre
      })), 
      null, 
      2
    )); */

    // Si NO hay candidatos, avisar y marcar la tarea
    if (candidatosConDisponibilidad.length === 0) {
      console.warn(`⚠️  La tarea "${tarea.descripcion}" NO tiene candidatos disponibles.`);

      devsDataPorTarea[tarea._id] = {
        tarea: {
          id: tarea._id,
          nombre: tarea.nombre,
          descripcion: tarea.descripcion,
          fechaEstimadaInicio: tarea.fechaEstimadaInicio,
          fechaEstimadaFin: tarea.fechaEstimadaFin,
          habilidadesRequeridas: tarea.habilidadesRequeridas,
          prioridad: tarea.prioridad,
          estimacionHoras: tarea.tiempoEstimadoHoras
        },
        desarrolladoresCandidatos: [],
        sinCandidatos: true      // <-- agregado para marcar la situación
      };

      // Continuar con la siguiente tarea
      continue;
    }


    // Guardar candidatos simples (lo que verá la IA en una lista resumida)
    candidatosPorTarea[tarea._id] = candidatosConDisponibilidad.map(dev => ({
      id: dev._id,
      nombre: dev.nombre,
      apellido: dev.apellido,

      habilidades: dev.habilidades, // [{nombre, nivel}]
      aniosExperiencia: dev.aniosExperiencia,
      costoPorHora: dev.costoPorHora,

      // Preferencias y gustos
      preferenciasHabilidad: dev.preferenciasHabilidad ?? [],

      // Métricas históricas
      rendimientoHistorico: dev.rendimientoHistorico,
      puntuacionPromedioCalidad: dev.puntuacionPromedioCalidad,
      feedbackHistorico: dev.feedbackHistorico,

    }));


    // --- CÁLCULO DE DISPONIBILIDAD REAL POR CANDIDATO ---
    devsDataPorTarea[tarea._id] = {
      tarea: {
        id: tarea._id,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        fechaEstimadaInicio: tarea.fechaEstimadaInicio,
        fechaEstimadaFin: tarea.fechaEstimadaFin,
        habilidadesRequeridas: tarea.habilidadesRequeridas,
        prioridad: tarea.prioridad,
        estimacionHoras: tarea.tiempoEstimadoHoras
        // lo que tengas y sea útil para decidir
      },
      desarrolladoresCandidatos: await Promise.all(
        candidatosPorHabilidad.map(async (dev) => {
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

            disponibilidad: {
              diasDisponibles // [{fecha, horasDisponibles}]
            }
          };
        })
      )
    };

    /* console.log("Estructura final para IA de esta tarea:");
    console.log(JSON.stringify(devsDataPorTarea[tarea._id], null, 2)); */
  }

  // Retornar data completa para todas las tareas (devsDataPorTarea)
  console.log("Data completa para IA de todas las tareas:");
  console.log(JSON.stringify(devsDataPorTarea, null, 2));

const payloadIA = {
  projectId,
  devsDataPorTarea: devsDataPorTarea
};
  // 🧠 Prompt IA
  const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Teniendo en cuenta que devsDataPorTarea guarda para cada tarea una lista de desarrolladores que pasan los filtros obligatorios, asignar cada tarea al desarrollador dentro de cada lista que tenga la mayor cantidad de habilidades requeridas para la tarea y mayor disponibilidad en el rango de fechas estimadas para no sobrecargar a los desarrolladores,
considerando:
- Disponibilidad diaria (horas por fecha)
- Tiempo estimado de la tarea (tiempoEstimadoHoras)
- Habilidades requeridas de la tarea
- Habilidades del desarrollador
- 

Reglas de asignación:

1) PRIMER FILTRO (OBLIGATORIO)
- Dentro cada lista de desarrolladores para cada tarea, seleccionar a los que tengan la mayor cantidad de habilidades requeridas para la tarea. (NO SELECCIONAR UN DESARROLLADOR QUE NO ESTE EN LA LISTA DE CANDIDATOS DE LA TAREA).

2) SEGUNDO FILTRO - MUY IMPORTANTE
Entre los desarrolladores filtrados en el primer filtro para cada tarea:
- Elegir el desarrolador que cuente con mas disponibilidad en el rango de fechas estimadas de la tarea, para no sobrecargar a los desarrolladores. En caso de empate, elegir teniendo en cuenta las preferencias de habilidades (preferenciasHabilidad) del desarrollador, priorizando aquellos que tengan mejor puntuación promedio en las habilidades requeridas por la tarea. (NO SELECCIONAR UN DESARROLLADOR QUE NO ESTE EN LA LISTA DE CANDIDATOS DE LA TAREA)

3) En en el caso de que la tarea no tenga desarrolladoresCandidatos ("sinCandidatos": true), no asignar ningún desarrollador y en el json que se pide solo mostrar los siguientes campos en el formato que corresponde al json para esa tarea:
  id: tarea._id,
  nombre: tarea.nombre,
  descripcion: tarea.descripcion,
  fechaEstimadaInicio: tarea.fechaEstimadaInicio,
  fechaEstimadaFin: tarea.fechaEstimadaFin,
  habilidadesRequeridas: tarea.habilidadesRequeridas,
  prioridad: tarea.prioridad,
  estimacionHoras: tarea.horasTotales
  sinCandidatos: true para esa tarea. 

4) ASIGNACIÓN
- MUY IMPORTANTE: solo se deben tener en cuenta para la selección las habilidades requeridas de la tarea y las habilidades del desarrollador. No considerar ninguno de los otros factores, como años de experiencia, costo por hora, rendimiento histórico, calidad o feedback histórico para la selección del desarrollador.
- Distribuir las horas de forma uniforme entre los dias disponibles.
- Calcular horasEstimadasReales 
- Calcular costoTotal según horasTotales y costoPorHora del desarrollador.

Devuelve un JSON **válido** con esta estructura (Nada más que el JSON):
{
  projectId: "ID del proyecto",
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
      ], si o si debe estar lleno con la distribución de horas asignadas por día si la tarea fue asignada
      "horasTotales": numero,
      "tipoAsignacion": "basica",
      "razon": "Explicación detallada de por qué fue asignado o no",
      "costoTotal": "costo total de la tarea según horas y costo por hora del dev seleccionado",
      "porcentajeRendimiento": "rendimientoHistorico.promedioPorcentaje del dev seleccionado",
      "horasEstimadasSegunRendimiento": "resultado del calculo = horasTotales * (rendimientoHistorico.promedioPorcentaje / 100), redondeado a 2 decimales || horasTotales si no hay rendimientoHistorico",
      "calidadTarea": "puntuacionPromedioCalidad.puntuacionPromedio (del dev elegido)",
      "feedbackHistorico": "feedbackHistorico.puntuacionPromedio (del dev elegido)" 
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
      ...asignacion,                // tareaId, descripcion, etc.
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

      razon: `${asignacionManual.razon} Asignación realizada manualmente por el administrador.`
    };

    nuevasAsignaciones.push(asignacionCompletada);
  }

  // Devolvemos el mismo formato, pero con las asignaciones completadas
  return {
    ...resultadoIA,
    asignaciones: nuevasAsignaciones
  };
}

export async function confirmarAsignacionBasica(projectId, sugerencias) {
  const resultados = [];
  const idsAsignacionesCreadas = [];

  if (!sugerencias || !Array.isArray(sugerencias.asignaciones)) {
    throw new Error("Formato de sugerencias inválido. Se esperaba un array de asignaciones.");
  }

  const asignaciones = sugerencias.asignaciones;
  const {
    costoTotalProyecto,
    tiempoTotalEstimadoRealProyecto,
    tiempoTotalAsignadoProyecto,
    calidadPromedioTareas,
    calidadPromedioProyecto
  } = sugerencias;

  for (const asignacion of asignaciones) {

    const {
      tareaId,
      desarrolladorId,
      dias,
      horasTotales,
      razon,
      porcentajeRendimiento,
      horasEstimadasReales,
      calidadTarea,
      feedbackHistorico,
      costoTotal
    } = asignacion;

    // ❌ NO PROCESAR ASIGNACIÓN SIN DÍAS
    if (!dias || dias.length === 0) {
      resultados.push({
        tarea: tareaId,
        estado: "omitida",
        mensaje: "No se creó la asignación porque no hay días asignados (sin disponibilidad)."
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
        mensaje: "Tarea, desarrollador o proyecto no encontrado",
      });
      continue;
    }

    // Actualizar calendario
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

    // Validar duplicados
    const existeAsignacion = await Asignacion.findOne({ tarea: tareaId });
    if (existeAsignacion) {
      resultados.push({
        tarea: tareaDB.descripcion,
        estado: "omitida",
        mensaje: `La tarea "${tareaDB.descripcion}" ya está asignada.`,
      });
      continue;
    }

    // Crear asignación con toda la data simulada
    const nuevaAsignacion = await Asignacion.create({
      tarea: tareaDB._id,
      desarrollador: dev._id,
      dias,
      horasTotales,
      proyecto: proyecto._id,
      tipoAsignacion: "basica",
      razon,

      // costo
      costoPorHora: dev.costoPorHora,
      costoTotal,

      // tiempo
      porcentajeRendimiento,
      horasEstimadasReales,

      // calidad
      puntuacionCalidad: calidadTarea,
      feedbackHistorico: feedbackHistorico?.puntuacionPromedio || null
    });

    idsAsignacionesCreadas.push(nuevaAsignacion._id);

    // Actualizar tarea
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

  await Project.findByIdAndUpdate(projectId, { costoTotal: costoTotalProyecto });

  // Guardar simulación completa
  await SimulationAssignment.create({
    proyecto: projectId,
    criterio: "basica",
    asignaciones: idsAsignacionesCreadas,
    costoTotalSimulado: costoTotalProyecto,
    tiempoTotalSimulado: tiempoTotalEstimadoRealProyecto,
    tiempoTotalEstimado: tiempoTotalAsignadoProyecto,
    calidadPromedioTareas: calidadPromedioTareas,
    calidadPromedioSimulado: calidadPromedioProyecto
  });

  return {
    message: "Asignaciones confirmadas y simulación guardada (modo tiempo)",
    resultados
  };
}

export async function asignarTareasConCalendario(projectId) {
  // 🔹 obtener todas las tareas pendientes
  let tareas = await Task.find({
    proyecto: projectId,
    desarrolladorAsignado: null,
    estado: "pendiente"
  }).populate("proyecto");

  if (!tareas.length) {
    return { message: "No hay tareas pendientes en este proyecto", resumen: [] };
  }

  // 🔹 ordenar tareas (prioridad/dificultad)
  tareas = ordenarTareas(tareas);

  // 🔹 obtener desarrolladores
  const desarrolladores = await User.find({ rol: "user" });

  const resumen = [];
  let costoTotalProyecto = 0;
  for (const tarea of tareas) {
    const fechaInicio = new Date(tarea.fechaEstimadaInicio);
    const fechaFin = new Date(tarea.fechaEstimadaFin);


    // 1️⃣ filtrar candidatos
    const candidatos = desarrolladores.filter(dev =>
      tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7) &&
      tieneDisponibilidad(dev, fechaInicio, fechaFin, tarea.tiempoEstimadoHoras)
    );

    if (!candidatos.length) {
      resumen.push({
        tarea: tarea.descripcion,
        asignado: null,
        motivo: "No hay dev con disponibilidad suficiente o habilidades requeridas"
      });
      continue;
    }

    // 2️⃣ elegir el mejor dev
    const mejorDev = seleccionarMejorDev(candidatos, fechaInicio, fechaFin);
    const costoTarea = calcularCostoDev(mejorDev, tarea.tiempoEstimadoHoras);
    costoTotalProyecto += costoTarea;

    // 3️⃣ asignar la tarea al dev
    tarea.desarrolladorAsignado = mejorDev._id;
    await tarea.save();

    // 4️⃣ descontar horas en el calendario del dev 
    let horasRestantes = tarea.tiempoEstimadoHoras;
    const diasAsignados = [];

    for (const dia of obtenerDiasDisponibles(fechaInicio, fechaFin)) {
      if (horasRestantes <= 0) break;

      const diaISO = dia.toISOString().split("T")[0];
      let registroDia = mejorDev.calendario.find(d =>
        d.fecha.toISOString().split("T")[0] === diaISO
      );

      if (!registroDia) {
        registroDia = { fecha: new Date(dia), horasDisponibles: 8 };
        mejorDev.calendario.push(registroDia);
      }

      const horasAsignadas = Math.min(registroDia.horasDisponibles, horasRestantes);

      if (horasAsignadas > 0) {
        registroDia.horasDisponibles -= horasAsignadas;
        horasRestantes -= horasAsignadas;

        diasAsignados.push({
          fecha: new Date(dia),
          horasAsignadas
        });
      }
    }

    await mejorDev.save();

    // Actualizar costo total del proyecto en la base de datos
    const proyecto = tarea.proyecto;
    proyecto.costoTotal = costoTotalProyecto;
    await proyecto.save();

    // 📌 guardar registro de asignación
    await Asignacion.create({
      tarea: tarea._id,
      desarrollador: mejorDev._id,
      dias: diasAsignados,
      horasTotales: tarea.tiempoEstimadoHoras,
      proyecto: tarea.proyecto._id
    });

    resumen.push({
      tarea: tarea.descripcion,
      asignado: `${mejorDev.nombre} ${mejorDev.apellido}`,
      dias: diasAsignados,
      horasAsignadasTotales: tarea.tiempoEstimadoHoras - horasRestantes
    });
  }

  return {
    message: "Asignación automática con calendario diario completada",
    resumen
  };
}
