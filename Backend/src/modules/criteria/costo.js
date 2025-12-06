import OpenAI from "openai";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";
import dotenv from "dotenv";
import Asignacion from "../assignment/assignment.model.js";
import { verificarYActualizarCalendario } from "../users/user.service.js";
import { getFeedbackByUser } from "../performanceFeedback/performanceFeedback.service.js";
import { getTaskLogsByDeveloper } from "../task/task.service.js";
import SimulationAssignment from "../simulationAssignment/simulationAssignment.model.js";
import { ordenarTareas } from "../../utils/asignacionBasica/ordenarTareas.js";

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
    throw new Error("No hay tareas para este proyecto");

  // Ordenar tareas por prioridad y dificultad
  tareas = ordenarTareas(tareas);

  // 🔹 Obtener desarrolladores disponibles
  let desarrolladores = await User.find({ rol: "user" });

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

for (const tarea of tareas) {

  // --- PRIMER FILTRO: habilidades mínimas 50% ---
  const candidatosPorHabilidad = desarrolladores.filter(dev => {
    if (!tarea.habilidadesRequeridas?.length) return true;

    const habDev = dev.habilidades.map(h => h.nombre.trim().toLowerCase());
    const habReq = tarea.habilidadesRequeridas.map(h => h.trim().toLowerCase());

    const cantidad = habReq.filter(h => habDev.includes(h)).length;
    return cantidad / habReq.length >= 0.5;
  });

  // Guardar candidatos simples (lo que verá la IA)
  candidatosPorTarea[tarea._id] = candidatosPorHabilidad.map(dev => ({
    id: dev._id,
    nombre: dev.nombre,
    apellido: dev.apellido,
    habilidades: dev.habilidades,
    costoPorHora: dev.costoPorHora,
    rendimientoHistorico: dev.rendimientoHistorico,
    preferencias: dev.preferencias
  }));


  // --- CÁLCULO DE DISPONIBILIDAD REAL POR CANDIDATO ---
  devsDataPorTarea[tarea._id] = await Promise.all(
    candidatosPorHabilidad.map(async (dev) => {

      const diasDisponibles = confirmarAsignacionPorCosto(
        dev,
        tarea.fechaEstimadaInicio,
        tarea.fechaEstimadaFin
      );

      // Construir objeto completo para IA
      return {
        id: dev._id,
        nombre: dev.nombre,
        apellido: dev.apellido,
        experiencia: dev.aniosExperiencia,

        habilidades: dev.habilidades?.map(h => ({
          nombre: h.nombre,
          nivel: h.nivel
        })),

        preferencias: dev.preferencias,
        costoPorHora: dev.costoPorHora,
        rendimientoHistorico: dev.rendimientoHistorico,

        disponibilidad: {
          tareaId: tarea._id,
          diasDisponibles // [{fecha, horasDisponibles}]
        },

        performanceFeedback: getFeedbackByUser(dev._id),
        taskLogs: await getTaskLogsByDeveloper(dev._id)
      };
    })
  );
}


  // 🧠 Prompt IA
  const prompt = `
Eres un asistente experto en planificación de proyectos y asignación óptima de recursos humanos.

Objetivo:
Teniendo en cuenta que candidatosxTarea guarda para cada tarea recomendaciones de desarrolladores, asignar cada tarea al desarrollador que tenga el menor costo por hora, considerando las siguientes reglas y datos:
- Disponibilidad diaria (horas por fecha)
- Tiempo estimado de la tarea (tiempoEstimadoHoras)
- Habilidades requeridas
- Costo por hora de cada desarrollador

Reglas de asignación:

1) PRIMER FILTRO (OBLIGATORIO)
- Dentro cada lista de recomendados para cada tarea, validar que tenga disponibilidad suficiente dentro del rango de fechas estimadas para completar todas las horas de la tarea.
Si ningún desarrollador pasa este filtro, omitir la tarea y explicar claramente la razón.

2) SEGUNDO FILTRO - MUY IMPORTANTE
Entre los desarrolladores filtrados en el primer filtro para cada tarea:
- elegir al desarrollador con el menor costo por hora.
- si hay empate elegir al desarrollador que tenga las mayor cantidad de habilidades requeridas para la tarea.


3) ASIGNACIÓN
- Distribuir las horas de forma uniforme según disponibilidad.
- Calcular horasEstimadasReales 
- Calcular costoTotal según horasTotales y costoPorHora del desarrollador.

4) CÁLCULOS GLOBALES DEL PROYECTO
- costoTotalProyecto = suma de costosTotales
- tiempoTotalEstimadoRealProyecto = suma de horasEstimadasReales
- tiempoTotalAsignadoProyecto = suma de horasTotales
- calidadPromedioTareas = promedio de calidadTarea
- calidadPromedioProyecto = promedio del feedback de todos los desarrolladores asignados

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
      ], si o si debe estar lleno con la distribución de horas asignadas por día si la tarea fue asignada
      "horasTotales": numero,
      "tipoAsignacion": "costo",
      "razon": "Explicación detallada de por qué fue asignado",
      "costoTotal": "costo total de la tarea según horas y costo por hora del dev seleccionado",
      "porcentajeRendimiento": "rendimientoHistorico.promedioPorcentaje del dev seleccionado",
      "horasEstimadasReales": "resultado del calculo = horasTotales * (rendimientoHistorico.promedioPorcentaje / 100), redondeado a 2 decimales || horasTotales si no hay rendimientoHistorico",
      "calidadTarea": "puntuacion promedio segun todos los TaskLog (puntuacionCalidad) del dev seleccionado || 0 si no tiene tareas previas",
      "feedbackHistorico": {
        "puntuacionPromedioFeedback": numero,
        "vecesCalificadoFeedback": numero
      } (del dev elegido) calcula el promedio segun performanceFeedback de proyectos previos || 0 si no tiene feedback
    }
  ],
  "costoTotalProyecto": "costo total de todas las tareas asignadas según horas y costo por hora",
  "tiempoTotalEstimadoRealProyecto": "tiempo que se estima va demorarse completar todas las tareas en horas (suma de horasEstimadasReales de todas las tareas), redondeado a 2 decimales",
  "tiempoTotalAsignadoProyecto": "tiempo total en horas que se asignó a los desarrolladores para completar las tareas segun tiempoEstimadoHoras",
  "calidadPromedioTareas": "promedio de las puntuaciones históricas de calidad de los devs seleccionados (calidadTarea)",
  "calidadPromedioProyecto": "promedio de los feedbackHistorico de todos los desarrolladores asignados"
  }

Datos:
${JSON.stringify({ tareas: tareasData, candidatosxTarea: devsDataPorTarea }, null, 2)}

`;
  console.log("Candidatos por tareas: ", candidatosPorTarea)
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

export async function confirmarAsignacionPorCosto(projectId, sugerencias) {
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
      tipoAsignacion: "costo",
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
    criterio: "costo",
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

export async function asignarTareasPorCosto(projectId) {
    // 🔹 obtener tareas pendientes
    let tareas = await Task.find({
        proyecto: projectId,
        desarrolladorAsignado: null,
        estado: "pendiente"
    }).populate("proyecto");

    if (!tareas.length) {
        return { message: "No hay tareas pendientes en este proyecto", resumen: [] };
    }

    tareas = ordenarTareas(tareas);
    const desarrolladores = await User.find({ rol: "user" });

    const resumen = [];
    let costoTotalProyecto = 0;

    for (const tarea of tareas) {
        const fechaInicio = new Date(tarea.fechaEstimadaInicio);
        const fechaFin = new Date(tarea.fechaEstimadaFin);
        // 🔍 candidatos con disponibilidad
        const candidatos = desarrolladores.filter(dev =>
            tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7) &&
            tieneDisponibilidad(dev, fechaInicio, fechaFin, tarea.tiempoEstimadoHoras)
        );

        if (candidatos.length === 0) {
            resumen.push({
                tarea: tarea.descripcion,
                asignado: null,
                motivo: "Sin desarrolladores con disponibilidad"
            });
            continue;
        }

        // 💰 seleccionar dev más barato
        const devSeleccionado = seleccionarDevMasBarato(candidatos);
        const costoTarea = calcularCostoDev(devSeleccionado, tarea.tiempoEstimadoHoras);
        costoTotalProyecto += costoTarea;

        // 📅 actualizar calendario día por día
        const diasAsignacion = [];
        const diasDisponibles = obtenerDiasDisponibles(
            tarea.fechaEstimadaInicio,
            tarea.fechaEstimadaFin,
            devSeleccionado
        );

        let horasRestantes = tarea.tiempoEstimadoHoras;

        for (const dia of diasDisponibles) {
            if (horasRestantes <= 0) break;

            const diaISO = dia.toISOString().split("T")[0];
            let registroDia = devSeleccionado.calendario.find(
                d => d.fecha.toISOString().split("T")[0] === diaISO
            );

            if (!registroDia) {
                registroDia = { fecha: new Date(dia), horasDisponibles: 8 };
                devSeleccionado.calendario.push(registroDia);
            }

            const horasAsignadas = Math.min(registroDia.horasDisponibles, horasRestantes);
            registroDia.horasDisponibles -= horasAsignadas;
            horasRestantes -= horasAsignadas;

            diasAsignacion.push({
                fecha: new Date(dia),
                horasAsignadas
            });
        }


        await devSeleccionado.save();

        // Actualizar costo total del proyecto en la base de datos
        const proyecto = tarea.proyecto;
        proyecto.costoTotal = costoTotalProyecto;
        await proyecto.save();

        // 🧾 registrar asignación
        await Asignacion.create({
            tarea: tarea._id,
            desarrollador: devSeleccionado._id,
            dias: diasAsignacion,
            horasTotales: tarea.tiempoEstimadoHoras,
            proyecto: tarea.proyecto._id,
            tipoAsignacion: "costo"
        });

        // 🔄 actualizar tarea
        tarea.desarrolladorAsignado = devSeleccionado._id;
        await tarea.save();

        resumen.push({
            tarea: tarea.descripcion,
            asignado: `${devSeleccionado.nombre} ${devSeleccionado.apellido}`,
            costoPorHora: devSeleccionado.costoPorHora,
            costoTotal: costoTarea,
            dias: diasAsignacion
        });
    }

    return {
        message: "Asignación automática por costo completada",
        costoTotalProyecto,
        resumen
    };
}