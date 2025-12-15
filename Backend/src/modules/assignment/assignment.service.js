import { findAsignacionById, saveAsignacion, saveUser, saveTask, findAsignacionesByProyecto } from "./assignment.dao.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js"; // tu función que ya verifica horas
import { findUserById } from "../users/user.dao.js";
import { calcularCostoDev } from "../../utils/asignacionCosto/costoTarea.js";
import Task from "../task/task.model.js";
import SimulacionAsignacion from "../simulationAssignment/simulationAssignment.model.js";
import User from "../users/user.model.js";
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js";

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

export const asignarTareaManual = async (asignacion) => {
  const fechaInicio = new Date(asignacion.fechaEstimadaInicio);
  const fechaFin = new Date(asignacion.fechaEstimadaFin);

  const devNuevo = await User.findById(asignacion.desarrolladorId);
  console.log(devNuevo);
  if (!devNuevo) {
    throw new Error("Desarrollador no encontrado");
  }

  // Usar el campo de horas que tengas definido
  const horasNecesarias = asignacion.estimacionHoras ?? 0;

  // 1. Verificar disponibilidad del desarrollador en el rango
  const disponible = tieneDisponibilidad(
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

  // 2. Obtener detalle de disponibilidad por día
  const diasDisponibles = obtenerDisponibilidadEnRango(
    devNuevo,
    fechaInicio,
    fechaFin
  );
  // diasDisponibles: [{ fecha, horasDisponibles }]

  // 3. Armar el plan de asignación día a día (SIN modificar calendario real)
  let horasRestantes = horasNecesarias;
  const diasAsignados = [];

  for (const dia of diasDisponibles) {
    if (horasRestantes <= 0) break;

    const horasLibres = dia.horasDisponibles ?? dia.horas ?? 0;
    if (horasLibres <= 0) continue;

    const horasAsignadas = Math.min(horasLibres, horasRestantes);

    diasAsignados.push({
      fecha: new Date(dia.fecha),
      horasAsignadas
    });

    horasRestantes -= horasAsignadas;
  }

  // Por seguridad: si algo raro pasó y no se cubrieron todas las horas
  const horasTotalesAsignadas = diasAsignados.reduce(
    (acc, d) => acc + d.horasAsignadas,
    0
  );

  if (horasTotalesAsignadas < horasNecesarias) {
    console.warn(
      `⚠️ Solo se pudieron asignar ${horasTotalesAsignadas}h de ${horasNecesarias}h requeridas.`
    );
  }

  // 4. Calcular métricas derivadas (igual que la IA)
  const costoPorHora = devNuevo.costoPorHora ?? 0;
  const costoTotal = horasTotalesAsignadas * costoPorHora;

  const porcentajeRendimiento =
    devNuevo.rendimientoHistorico?.promedioPorcentaje ?? 100;

  const horasEstimadasSegunRendimiento = Number(
  (horasTotalesAsignadas * (porcentajeRendimiento / 100)).toFixed(2)
);

  const calidadTarea =
    devNuevo.puntuacionPromedioCalidad?.puntuacionPromedio ?? 0;

  const feedbackHistorico =
    devNuevo.feedbackHistorico?.puntuacionPromedio ?? 0;

  // 5. Construir el objeto de asignación manual (misma forma que la IA)
  const asignacionManual = {
    tareaId: asignacion.tareaId.toString(),
    descripcion: asignacion.descripcion,

    desarrolladorId: devNuevo._id.toString(),
    nombre: devNuevo.nombre,
    apellido: devNuevo.apellido,

    rendimientoHistorico: devNuevo.rendimientoHistorico,
    dias: diasAsignados,               // [{ fecha, horasAsignadas }]
    horasTotales: horasTotalesAsignadas,

    tipoAsignacion: asignacion.tipoAsignacion,
    razon: `Asignación realizada manualmente por el administrador".`,

    costoTotal,
    porcentajeRendimiento,
    horasEstimadasSegunRendimiento,
    calidadTarea,
    feedbackHistorico
  };

  return asignacionManual;
};


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

export async function asignarTareasBasico(projectId) {
  return await asignarTareasConCalendario(projectId);
}

export const asignarPorCostoService = async (projectId) => {
  return await asignarTareasPorCosto(projectId);
};

