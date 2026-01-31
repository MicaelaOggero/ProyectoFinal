import { findAsignacionById, saveAsignacion, saveUser, saveTask, findAsignacionesByProyecto } from "./assignment.dao.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js"; // tu función que ya verifica horas
import { findUserById } from "../users/user.dao.js";
import { calcularCostoDev } from "../../utils/asignacionCosto/costoTarea.js";
import Task from "../task/task.model.js";
import SimulacionAsignacion from "../simulationAssignment/simulationAssignment.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";

export async function recalcularDatosGlobales(simulacionActualizada, costoTotalSimulado) {
  if (!simulacionActualizada) throw new Error("Simulación inválida");
  if (!Array.isArray(simulacionActualizada.asignaciones)) {
    throw new Error("La simulación no tiene asignaciones pobladas");
  }

  const asignaciones = simulacionActualizada.asignaciones;

  // Helpers
  const parseNum = (v) => {
    if (typeof v === "number") return v;
    if (v == null) return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  // Acumuladores
  let tiempoTotalEstimado = 0;
  let tiempoTotalSimulado = 0;

  let sumaCalidadTareas = 0;
  let contadorCalidadTareas = 0;

  let sumaCalidadSimulada = 0;
  let contadorCalidadSimulada = 0;

  // Si querés calcular costo desde asignaciones en lugar de pasar costoTotalSimulado por parámetro,
  // podés usar esto:
  // let costoTotalSimuladoCalc = 0;

  for (const a of asignaciones) {
    // --- Tiempo estimado (plan) ---
    // Preferimos horasTotales de la asignación si existe; si no, caemos a tarea.tiempoEstimadoHoras
    const horasEstimadasPlan =
      a?.horasTotales != null
        ? parseNum(a.horasTotales)
        : parseNum(a?.tarea?.tiempoEstimadoHoras);

    tiempoTotalEstimado += horasEstimadasPlan;

    // --- Tiempo simulado (real estimado por rendimiento) ---
    // Tu lógica previa: usar horasEstimadasSegunRendimiento si viene, sino horasTotales
    const horasSimuladas =
      a?.horasEstimadasSegunRendimiento != null
        ? parseNum(a.horasEstimadasSegunRendimiento)
        : horasEstimadasPlan;

    tiempoTotalSimulado += horasSimuladas;

    // --- Calidad de tareas ---
    // En tu payload suele venir como calidadTarea (o puntuacionCalidad según tu asignación)
    const calidadTarea =
      a?.calidadTarea != null ? parseNum(a.calidadTarea) :
      a?.puntuacionCalidad != null ? parseNum(a.puntuacionCalidad) :
      0;

    if (calidadTarea > 0) {
      sumaCalidadTareas += calidadTarea;
      contadorCalidadTareas++;
    }

    // --- Calidad simulada (feedback histórico) ---
    // Tu asignación tiene feedbackHistorico, o dev.feedbackHistorico.puntuacionPromedio
    const feedback =
      a?.feedbackHistorico != null ? parseNum(a.feedbackHistorico) :
      a?.desarrollador?.feedbackHistorico?.puntuacionPromedio != null
        ? parseNum(a.desarrollador.feedbackHistorico.puntuacionPromedio)
        : 0;

    if (feedback > 0) {
      sumaCalidadSimulada += feedback;
      contadorCalidadSimulada++;
    }

    // --- Costo (opcional calcular desde asignación) ---
    // Si en Asignacion guardás costoTarea:
    // costoTotalSimuladoCalc += parseNum(a?.costoTarea);
    // o si guardás costoPorHora:
    // costoTotalSimuladoCalc += parseNum(a?.costoPorHora) * horasEstimadasPlan;
  }

  const calidadPromedioTareas =
    contadorCalidadTareas > 0 ? Number((sumaCalidadTareas / contadorCalidadTareas).toFixed(2)) : 0;

  const calidadPromedioSimulado =
    contadorCalidadSimulada > 0 ? Number((sumaCalidadSimulada / contadorCalidadSimulada).toFixed(2)) : 0;

  // ✅ Actualizar la simulación (documento Mongoose)
  simulacionActualizada.tiempoTotalEstimado = Number(tiempoTotalEstimado.toFixed(2));
  simulacionActualizada.tiempoTotalSimulado = Number(tiempoTotalSimulado.toFixed(2));
  simulacionActualizada.calidadPromedioTareas = calidadPromedioTareas;
  simulacionActualizada.calidadPromedioSimulado = calidadPromedioSimulado;
  simulacionActualizada.costoTotalSimulado = Number(parseNum(costoTotalSimulado).toFixed(2));

  // No hago save acá porque vos ya hacés:
  // await simulacionActualizada.save();
  return simulacionActualizada;
}


// 🔧 Helper para registrar cambios automáticamente
function registrarCambio(tarea, campo, valorAnterior, valorNuevo, userId = null) {
  // Evitar registrar si no cambió realmente
  if (JSON.stringify(valorAnterior) === JSON.stringify(valorNuevo)) return;

  tarea.historial.push({
    campo,
    valorAnterior,
    valorNuevo,
    cambiadoPor: userId, // si después agregás autenticación real se completa
    fechaCambio: new Date()
  });
}

export const editarAsignacionService = async (asignacionId, nuevoDevId, userId) => {

  // 1. Buscar la asignación original
  const asignacion = await findAsignacionById(asignacionId);
  if (!asignacion) throw new Error("Asignación no encontrada");

  // Obtener la simulación a la que pertenece esta asignación
  const simulacion = await SimulacionAsignacion.findOne({
    asignaciones: asignacionId
  }).populate("asignaciones");

  if (!simulacion) throw new Error("No se encontró la simulación asociada a esta asignación");

  const tarea = asignacion.tarea;
  const devOriginal = asignacion.desarrollador;
  const devNuevo = await findUserById(nuevoDevId);

  //verificar que el devNuevo sea diferente al original
  if (devOriginal._id.toString() === devNuevo._id.toString()) {
    throw new Error("El nuevo desarrollador debe ser diferente al original");
  }

  if (!devNuevo) throw new Error("Nuevo desarrollador no encontrado");

  // 🛑 VALIDACIÓN NUEVA: solo puede editarse si la tarea está en pendiente
  if (tarea.estado !== "pendiente") {
    throw new Error(
      `La asignación no puede editarse porque la tarea está en estado "${tarea.estado}".`
    );
  }

  // 2. Verificar disponibilidad
  const fechaInicio = new Date(tarea.fechaEstimadaInicio);
  const fechaFin = new Date(tarea.fechaEstimadaFin);
  const horasNecesarias = tarea.tiempoEstimadoHoras;

  console.log(fechaInicio, fechaFin, horasNecesarias);

  const disponible = tieneDisponibilidad(devNuevo, fechaInicio, fechaFin, horasNecesarias);
  if (!disponible) {
    throw new Error("El nuevo desarrollador no tiene disponibilidad suficiente en las fechas de la tarea");
  }

  // 3. Restaurar horas al dev original
  asignacion.dias.forEach(dia => {
    const reg = devOriginal.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === new Date(dia.fecha).toISOString().split("T")[0]
    );
    if (reg) reg.horasDisponibles += dia.horasAsignadas;
  });


  // 4. Guardar valor anterior del desarrollador
  const desarrolladorAnterior = tarea.desarrolladorAsignado;

  

  // 5. Asignar nuevo desarrollador
  tarea.desarrolladorAsignado = devNuevo._id;

  // 📝 Registrar CAMBIO
  registrarCambio(tarea, "desarrolladorAsignado", desarrolladorAnterior, devNuevo._id, userId);


  // Guardar cambios en la tarea
  await tarea.save();

  // 6. Descontar horas al nuevo dev
  let horasRestantes = horasNecesarias;
  const nuevosDias = [];

  for (const dia of asignacion.dias) {
    if (horasRestantes <= 0) break;

    const diaISO = new Date(dia.fecha).toISOString().split("T")[0];
    let reg = devNuevo.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === diaISO
    );

    if (!reg) {
      reg = { fecha: new Date(dia.fecha), horasDisponibles: 8 };
      devNuevo.calendario.push(reg);
    }

    const horasAsignadas = Math.min(reg.horasDisponibles, horasRestantes);

    reg.horasDisponibles -= horasAsignadas;
    horasRestantes -= horasAsignadas;

    nuevosDias.push({ fecha: new Date(dia.fecha), horasAsignadas });
  }

   // 7. Recalcular costo de la tarea
  const costoAnterior = tarea.costoTarea;
  const nuevoCosto = calcularCostoDev(devNuevo, tarea.tiempoEstimadoHoras);
  tarea.costoTarea = nuevoCosto;

  registrarCambio(tarea, "costoTarea", costoAnterior, nuevoCosto, userId);

  await saveTask(tarea);

  asignacion.desarrollador = devNuevo._id;
  asignacion.costoPorHora = devNuevo.costoPorHora;
  asignacion.dias = nuevosDias;
  asignacion.costoTarea = nuevoCosto;
  asignacion.razon = "Desarrollador cambiado manualmente";
  asignacion.porcentajeRendimiento = devNuevo.rendimientoHistorico.promedioPorcentaje || 0;
  asignacion.horasEstimadasReales = asignacion.horasTotales * (devNuevo.rendimientoHistorico.promedioPorcentaje / 100)
  asignacion.puntuacionCalidad = devNuevo.puntuacionPromedioCalidad.puntuacionPromedio || 0;
  asignacion.feedbackHistorico = devNuevo.feedbackHistorico.puntuacionPromedio || 0;
 

  //mostrar cambios
  console.log("Asignación editada:", {
    asignacionId: asignacion._id,
    tareaId: tarea._id,
    devOriginal: { id: devOriginal._id, nombre: devOriginal.nombre },
    devNuevo: { id: devNuevo._id, nombre: devNuevo.nombre },
    nuevosDiasAsignados: nuevosDias,
    nuevoCosto
  });

  // Guardar cambios en el desarrollador nuevo
  await saveUser(devNuevo);

  
  // Guardar cambios en el desarrollador original
  await saveUser(devOriginal);

   // Guardar cambios en la asignación
  await saveAsignacion(asignacion);

  // ---------------------------------------------------------
  // 🔥 10. RECALCULAR DATOS GLOBALES DE LA SIMULACIÓN 🔥
  // ---------------------------------------------------------
  const simulacionActualizada = await SimulacionAsignacion.findById(simulacion._id)
    .populate({
      path: "asignaciones",
      populate: [{ path: "tarea" }, { path: "desarrollador" }]
    });
  
  // 8. Recalcular el costo total del proyecto
  const proyecto = tarea.proyecto;
  const tareasProyecto = await Task.find({ proyecto: proyecto._id }).populate("desarrolladorAsignado");

  let costoTotal = 0;
  for (const t of tareasProyecto) {
    if (t.desarrolladorAsignado) {
      costoTotal += calcularCostoDev(t.desarrolladorAsignado, t.tiempoEstimadoHoras);
    }
  }

  proyecto.costoTotal = costoTotal;

  // Guardar cambios en el proyecto
  await proyecto.save();


  await recalcularDatosGlobales(simulacionActualizada, costoTotal);  

  // Guardar cambios en la asignación completa
  await simulacionActualizada.save();
  // ---------------------------------------------------------

  return asignacion;
};



/**
 * Asigna un desarrollador a una tarea manualmente SIN modificar la BD.
 * Devuelve un objeto de asignación con la misma forma que la IA.
 *
 * @param {Object} tarea       - Objeto tarea (con _id, descripcion, fechas, horas estimadas)
 * @param {Object} devNuevo    - Objeto desarrollador (User)
 * @returns {Object}           - Objeto de asignación manual
 */


function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function toISOStartOfDay(dateLike) {
  const d = new Date(dateLike);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export const asignarTareaManual = async (asignacion) => {
  const fechaInicio = new Date(asignacion.fechaEstimadaInicio);
  const fechaFin = new Date(asignacion.fechaEstimadaFin);

  const devNuevo = await User.findById(asignacion.desarrolladorId);
  if (!devNuevo) throw new Error("Desarrollador no encontrado");

  const horasNecesarias = Number(asignacion.estimacionHoras ?? 0);
  if (!horasNecesarias || Number.isNaN(horasNecesarias) || horasNecesarias <= 0) {
    throw new Error("La asignación no tiene estimacionHoras válida.");
  }

  // 1) Verificar disponibilidad
  const disponible = await tieneDisponibilidad(
    devNuevo,
    fechaInicio,
    fechaFin,
    horasNecesarias
  );

  if (!disponible) {
    throw new Error(
      `El desarrollador ${devNuevo.nombre} no tiene disponibilidad suficiente para la tarea "${asignacion.descripcion}".`
    );
  }

  // 2) Obtener disponibilidad por día
  // ✅ IMPORTANTE: pasá el DEV (no el _id) si tu helper trabaja con el objeto.
  const diasDisponibles = await obtenerDisponibilidadEnRango(
    devNuevo,     // <-- antes tenías devNuevo._id
    fechaInicio,
    fechaFin
  );

  // 3) Distribuir horas
  let horasRestantes = horasNecesarias;
  const diasAsignados = [];

  for (const dia of diasDisponibles || []) {
    if (horasRestantes <= 0) break;

    const horasLibres = Number(dia.horasDisponibles ?? dia.horas ?? 0);
    if (!horasLibres || horasLibres <= 0) continue;

    const horasAsignadas = Math.min(horasLibres, horasRestantes);

    diasAsignados.push({
      fecha: toISOStartOfDay(dia.fecha),
      horasAsignadas
    });

    horasRestantes -= horasAsignadas;
  }

  const horasTotalesAsignadas = diasAsignados.reduce((acc, d) => acc + d.horasAsignadas, 0);

  if (horasTotalesAsignadas < horasNecesarias) {
    throw new Error(
      `No se pudo cubrir la estimación completa: ${horasTotalesAsignadas}h de ${horasNecesarias}h.`
    );
  }

  // 4) Calcular costo total
  const costoTotal = round2(calcularCostoDev(devNuevo, horasNecesarias));

  // ==========================
  // ✅ DEFINIR LO QUE TE FALTABA
  // ==========================

  const rendimientoHistorico = devNuevo?.rendimientoHistorico ?? null;

  // horasEstimadasSegunRendimiento = horasTotales * (100 / promedioPorcentaje)
  // redondeado a 2 decimales || horasTotales si no hay rendimiento/promedio 0
  const promedio = Number(rendimientoHistorico?.promedioPorcentaje ?? 0);
  const horasEstimadasSegunRendimiento =
    promedio > 0
      ? round2(horasTotalesAsignadas * (100 / promedio))
      : round2(horasTotalesAsignadas);

  // calidadTarea y feedbackHistorico según tu contrato
  const calidadTarea = devNuevo?.puntuacionPromedioCalidad?.puntuacionPromedio ?? 0;
  const feedbackHistorico = devNuevo?.feedbackHistorico?.puntuacionPromedio ?? 0;

  // 5) Formato IA
  return {
    tareaId: String(asignacion.tareaId),
    descripcion: asignacion.descripcion,

    desarrolladorId: String(devNuevo._id),
    nombre: devNuevo.nombre,
    apellido: devNuevo.apellido ?? "",

    dias: diasAsignados,                 
    horasTotales: horasTotalesAsignadas, 

    tipoAsignacion: asignacion.tipoAsignacion ?? "basica",
    razon: "Asignación realizada manualmente por el administrador.",

    costoTotal: String(costoTotal),

    rendimientoHistorico: rendimientoHistorico
      ? {
          promedioPorcentaje: Number(rendimientoHistorico.promedioPorcentaje ?? 0),
          tareasCompletadas: Number(rendimientoHistorico.tareasCompletadas ?? 0)
        }
      : { promedioPorcentaje: 0, tareasCompletadas: 0 },

    horasEstimadasSegunRendimiento: String(horasEstimadasSegunRendimiento),

    calidadTarea: calidadTarea != null ? String(calidadTarea) : "0",
    feedbackHistorico: feedbackHistorico != null ? String(feedbackHistorico) : "0"
  };
};


export async function asignarManualService(resultado) {
  const { projectId, asignaciones } = resultado || {};
  if (!projectId) throw new Error("Falta projectId");
  if (!Array.isArray(asignaciones)) throw new Error("Falta asignaciones[]");

  // Traemos proyecto para rango/fechas si lo necesitás (opcional)
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Proyecto no encontrado");

  // Completamos SOLO las que eran sinCandidatos y ahora tienen desarrolladorId
  const nuevas = [];

  for (const a of asignaciones) {
    const esManual = a?.sinCandidatos === true && a?.desarrolladorId;

    if (!esManual) {
      nuevas.push(a);
      continue;
    }

    // Para asignarTareaManual necesitás fechaEstimadaInicio/Fin y estimacionHoras
    // Si no vienen en el JSON, las sacás de la Task:
    const task = await Task.findById(a.tareaId);
    if (!task) throw new Error(`Tarea no encontrada: ${a.tareaId}`);

    const asignacionParaCompletar = {
      ...a,
      tareaId: a.tareaId,
      descripcion: a.descripcion ?? task.descripcion ?? "",
      estimacionHoras: a.estimacionHoras ?? task.horasEstimadas ?? task.estimacionHoras,
      fechaEstimadaInicio: a.fechaEstimadaInicio ?? task.fechaEstimadaInicio ?? project.fechaInicio,
      fechaEstimadaFin: a.fechaEstimadaFin ?? task.fechaEstimadaFin ?? project.fechaFin,
    };

    const completa = await asignarTareaManual(asignacionParaCompletar);

    nuevas.push(completa);
  }

  return {
    ...resultado,
    projectId,
    asignaciones: nuevas,
  };
}


// Servicio para obtener asignaciones por proyecto
export const getAsignacionesPorProyectoService = async (proyectoId) => {
  const asignaciones = await findAsignacionesByProyecto(proyectoId);

  if (!asignaciones || asignaciones.length === 0) {
    throw new Error("No se encontraron asignaciones para este proyecto");
  }

  const asignacionesValidas = asignaciones.filter(a => a.tarea && a.desarrollador);

  // Podés formatear la respuesta si no querés mandar todo crudo
  return asignacionesValidas.map(asig => ({
    asignacionId: asig._id,
    tarea: {
      id: asig.tarea._id,
      descripcion: asig.tarea.descripcion,
      fechaEstimadaInicio: asig.tarea.fechaEstimadaInicio,
      fechaEstimadaFin: asig.tarea.fechaEstimadaFin,
      tiempoEstimadoHoras: asig.tarea.tiempoEstimadoHoras,
      estado: asig.tarea.estado,
    },
    desarrollador: {
      id: asig.desarrollador._id,
      nombre: asig.desarrollador.nombre,
      habilidades: asig.desarrollador.habilidades,
    },
    dias: asig.dias, // [{ fecha, horasAsignadas }]
    tipoAsignacion: asig.tipoAsignacion,
  }));
};




