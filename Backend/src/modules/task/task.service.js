import {
  createTask,
  saveTask,
  getTaskByIdDAO,
  deleteTask,
  findTasksByProject,
  findTasksByDeveloper,
  findTasksByProjectAndDeveloper,
  getTareasSinAsignar,
  obtenerTodasTareasDAO
} from "./task.dao.js";
import { ordenarTareas } from '../../utils/asignacionBasica/ordenarTareas.js';
import Project from "../projects/project.model.js";
import User from "../users/user.model.js";
import TaskLog from "../task/taskLog.model.js"; // 👈 importar el modelo
import Task from "../task/task.model.js";
import { actualizarRendimientoDesarrollador } from "../users/user.service.js";
import Notification from "../notifications/notification.model.js";

export async function addTask(taskData) {
  // 1️⃣ Verificar que el proyecto exista
  const proyectoExistente = await Project.findById(taskData.proyecto);
  if (!proyectoExistente) {
    throw new Error("El proyecto indicado no existe");
  }

  // 2️⃣ Validar que las fechas de la tarea estén dentro del rango del proyecto
  const fechaInicioTarea = new Date(taskData.fechaEstimadaInicio);
  const fechaFinTarea = new Date(taskData.fechaEstimadaFin);

  if (fechaInicioTarea < proyectoExistente.fechaInicioEstimada) {
    throw new Error(
      `La fecha de inicio de la tarea (${fechaInicioTarea.toDateString()}) no puede ser anterior al inicio estimado del proyecto (${proyectoExistente.fechaInicioEstimada.toDateString()}).`
    );
  }

  if (fechaFinTarea > proyectoExistente.fechaFinEstimada) {
    throw new Error(
      `La fecha de fin de la tarea (${fechaFinTarea.toDateString()}) no puede ser posterior a la fecha de fin estimada del proyecto (${proyectoExistente.fechaFinEstimada.toDateString()}).`
    );
  }

  // 2.1️⃣ Validar que no sea fin de semana (inicio o fin)
  const diaInicio = fechaInicioTarea.getUTCDay(); // 0 domingo, 6 sábado
  const diaFin = fechaFinTarea.getUTCDay();

  if (diaInicio === 0 || diaInicio === 6) {
    throw new Error(
      `La fecha de inicio (${fechaInicioTarea.toDateString()}) cae en fin de semana, y las tareas no pueden comenzar en sábado o domingo.`
    );
  }

  if (diaFin === 0 || diaFin === 6) {
    throw new Error(
      `La fecha de fin (${fechaFinTarea.toDateString()}) cae en fin de semana, y las tareas no pueden finalizar en sábado o domingo.`
    );
  }

  // 3️⃣ Verificar que el desarrollador exista (si fue asignado)
  if (taskData.desarrolladorAsignado) {
    const devExistente = await User.findById(taskData.desarrolladorAsignado);
    if (!devExistente) {
      throw new Error("El desarrollador asignado no existe");
    }
  }

  // 4️⃣ Crear la tarea
  return await createTask(taskData);
}


export async function editTask(taskId, taskData, usuarioId) {
  // 1. Buscar la tarea
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  // 2. Si se cambia desarrollador, validar que exista
  if (taskData.desarrolladorAsignado !== undefined && taskData.desarrolladorAsignado !== null) {
    const devExistente = await User.findById(taskData.desarrolladorAsignado);
    if (!devExistente) throw new Error("El desarrollador asignado no existe");
  }

  // 3. Recorrer campos enviados y registrar historial
  for (const key of Object.keys(taskData)) {
    const valorAnterior = tarea[key];
    const valorNuevo = taskData[key];

    // Guardar solo si cambió
    if (valorNuevo !== undefined && valorNuevo !== valorAnterior) {
      tarea.historial.push({
        campo: key,
        valorAnterior,
        valorNuevo,
        cambiadoPor: usuarioId,
        fechaCambio: new Date()
      });

      tarea[key] = valorNuevo;
    }
  }

  // 4. Guardar tarea
  await saveTask(tarea);
  return tarea;
}

export async function obtenerTodasTareasService() {
  const tareas = await obtenerTodasTareasDAO();
  // Podés agregar lógica extra si querés
  return tareas;
}

export async function getTaskById(taskId) {
  const tarea = await getTaskByIdDAO(taskId);

  if (!tarea) {
    throw new Error("Tarea no encontrada");
  }

  return tarea;
}

export async function removeTask(taskId) {

  return await deleteTask(taskId);

}

export async function getTasksByProject(projectId) {
  return await findTasksByProject(projectId);
}

export async function getTasksByDeveloper(userId) {
  return await findTasksByDeveloper(userId);
}


export async function getTasksByProjectAndDeveloper(projectId, developerId) {
  return await findTasksByProjectAndDeveloper(projectId, developerId);
}

export const obtenerTareasOrdenadasPorProyecto = async (projectId) => {
  const tareas = await getTareasSinAsignar(projectId, { estado: 'pendiente' });
  const tareasOrdenadas = ordenarTareas(tareas);
  console.log("Tareas ordenadas:", tareasOrdenadas);
  return tareasOrdenadas;
};

import SesionTrabajo from "../task/sesionTrabajo.js";

export async function iniciarTareaService(taskId, userId) {
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  const proyecto = await Project.findById(tarea.proyecto);
  if (!proyecto || proyecto.estado !== "en curso") {
    throw new Error("Proyecto no encontrado o no está en curso");
  }

  const desarrollador = await User.findById(userId);
  if (!desarrollador) throw new Error("Desarrollador no encontrado");

  if (!tarea.desarrolladorAsignado || tarea.desarrolladorAsignado.toString() !== userId.toString()) {
    throw new Error("No estás asignado a esta tarea");
  }

  if (tarea.estado !== "pendiente" && tarea.estado !== "pausada") {
    throw new Error("Solo se pueden iniciar tareas en estado 'pendiente' o 'pausada'");
  }

  if (tarea.cronometroActivo || tarea.sesionActiva) {
    throw new Error("La tarea ya tiene una sesión activa");
  }

  const nuevaSesion = await SesionTrabajo.create({
    tareaId: tarea._id,
    desarrolladorAsignado: userId,
    proyectoId: tarea.proyecto,
    fechaInicio: new Date(),
    estado: "activa"
  });

  const estadoAnterior = tarea.estado;

  tarea.estado = "en curso";
  tarea.cronometroActivo = true;
  tarea.sesionActiva = nuevaSesion._id;
  tarea.enTrabajoDesde = new Date();

  if (!tarea.fechaRealInicio) {
    tarea.fechaRealInicio = new Date();
  }

  tarea.historial.push({
    campo: "estado",
    valorAnterior: estadoAnterior,
    valorNuevo: "en curso",
    cambiadoPor: userId,
    fechaCambio: new Date()
  });

  await saveTask(tarea);

  return {
    message: "Tarea iniciada correctamente",
    tarea,
    sesion: nuevaSesion
  };
}

export async function pausarOCompletarTarea(taskId, userId, accion = "pausar", datosEdicion = {}) {
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  const desarrollador = await User.findById(userId);
  if (!desarrollador) throw new Error("Desarrollador no encontrado");

  if (!tarea.desarrolladorAsignado || tarea.desarrolladorAsignado.toString() !== userId.toString()) {
    throw new Error("No estás asignado a esta tarea");
  }

  if (tarea.estado !== "en curso") {
    throw new Error("Solo se pueden pausar o completar tareas en curso");
  }

  if (!tarea.sesionActiva) {
    throw new Error("La tarea no tiene una sesión activa");
  }

  const sesion = await SesionTrabajo.findById(tarea.sesionActiva);
  if (!sesion || sesion.estado !== "activa") {
    throw new Error("No se encontró una sesión activa válida");
  }

  const ahora = new Date();
  const diffMs = ahora - sesion.fechaInicio;
  const horasCalculadas = diffMs / (1000 * 60 * 60);

  let horasFinales = horasCalculadas;
  let editadaManualmente = false;
  let motivoEdicion = "";

  if (datosEdicion?.tiempoTrabajadoHoras != null) {
    const horasEditadas = Number(datosEdicion.tiempoTrabajadoHoras);

    if (Number.isNaN(horasEditadas) || horasEditadas < 0) {
      throw new Error("El tiempo editado es inválido");
    }

    horasFinales = horasEditadas;
    editadaManualmente = true;
    motivoEdicion = datosEdicion.motivoEdicion || "";
  }

  sesion.fechaFin = ahora;
  sesion.tiempoTrabajadoHoras = horasFinales;
  sesion.editadaManualmente = editadaManualmente;
  sesion.motivoEdicion = motivoEdicion;
  sesion.estado = "cerrada";

  await sesion.save();

  tarea.tiempoInvertidoHoras += horasFinales;
  tarea.enTrabajoDesde = null;
  tarea.cronometroActivo = false;
  tarea.sesionActiva = null;

  tarea.porcentajeTiempoInvertido =
    tarea.tiempoEstimadoHoras > 0
      ? (tarea.tiempoInvertidoHoras / tarea.tiempoEstimadoHoras) * 100
      : 0;

  const estabaRetrasada = tarea.retrasada;

  const retrasadaPorTiempo = tarea.tiempoInvertidoHoras > tarea.tiempoEstimadoHoras;
  const retrasadaPorFecha =
    tarea.fechaEstimadaFin &&
    new Date() > new Date(tarea.fechaEstimadaFin) &&
    accion !== "completar";

  tarea.retrasada = retrasadaPorTiempo || retrasadaPorFecha;

  if (accion === "pausar") {
    tarea.estado = tarea.retrasada ? "retrasada" : "pausada";
  }

  if (accion === "completar") {
    tarea.estado = "completada";
    tarea.fechaRealFin = ahora;
  }

  tarea.historial.push({
    campo: "estado",
    valorAnterior: "en curso",
    valorNuevo: tarea.estado,
    cambiadoPor: userId,
    fechaCambio: ahora
  });

  await saveTask(tarea);

  if (!estabaRetrasada && tarea.retrasada) {
    await notificarRetrasoTarea(tarea, desarrollador);
  }

  let nuevoPromedio = null;

  if (accion === "completar") {
    const estadoFinal =
      tarea.tiempoInvertidoHoras > tarea.tiempoEstimadoHoras
        ? "retrasada"
        : tarea.tiempoInvertidoHoras < tarea.tiempoEstimadoHoras
          ? "adelantada"
          : "completada";

    const log = await TaskLog.create({
      proyecto: tarea.proyecto?._id ?? tarea.proyecto,
      tarea: tarea._id,
      desarrollador: userId,
      duracionEstimadaHoras: tarea.tiempoEstimadoHoras,
      tiempoInvertidoHoras: tarea.tiempoInvertidoHoras,
      estado: estadoFinal,
      puntuacionCalidad: null,
    });

    const proyecto = await Project.findById(tarea.proyecto?._id ?? tarea.proyecto).select("administrador");
    if (!proyecto?.administrador) {
      throw new Error("El proyecto no tiene administrador asignado");
    }

    await Notification.create({
      receptor: proyecto.administrador,
      emisor: userId,
      tipo: "CALIFICAR_TAREA",
      proyecto: proyecto._id,
      tarea: tarea._id,
      taskLog: log._id,
      titulo: "Tarea completada: requiere calificación",
      mensaje: `El/la desarrollador/a ${desarrollador.nombre} ${desarrollador.apellido} completó la tarea "${tarea.descripcion}".`
    });

    nuevoPromedio = await actualizarRendimientoDesarrollador(userId);
  }

  return {
    message: `Tarea ${accion === "completar" ? "completada" : "pausada"} correctamente`,
    horasSesion: Number(horasFinales.toFixed(2)),
    horasTotales: Number(tarea.tiempoInvertidoHoras.toFixed(2)),
    porcentajeTiempoInvertido: Number(tarea.porcentajeTiempoInvertido.toFixed(2)),
    retrasada: tarea.retrasada,
    rendimientoActualizado: nuevoPromedio !== null ? Number(nuevoPromedio.toFixed(2)) : null
  };
}

async function notificarRetrasoTarea(tarea, desarrollador) {
  const proyecto = await Project.findById(tarea.proyecto).select("administrador");
  if (!proyecto?.administrador) return;

  //crear notificaciones para el desarrollador y el admin del proyecto

  await Notification.create({
    receptor: desarrollador._id,
    emisor: desarrollador._id,
    tipo: "RETRASO_TAREA",
    proyecto: proyecto._id,
    tarea: tarea._id,
    taskLog: log._id,
    titulo: "Tu tarea está retrasada",
    mensaje: `La tarea "${tarea.descripcion}" superó el tiempo estimado o su fecha prevista.`
  });

  await Notification.create(
    {
      receptor: proyecto.administrador,
      emisor: desarrollador._id,
      tipo: "RETRASO_TAREA",
      proyecto: proyecto._id,
      tarea: tarea._id,
      titulo: "Tarea retrasada en el proyecto",
      mensaje: `La tarea "${tarea.descripcion}" asignada a ${desarrollador.nombre} ${desarrollador.apellido} está retrasada.`
    }
  );
}

async function recalcularTiempoDesdeSesiones(taskId) {
  const sesiones = await SesionTrabajo.find({
    tareaId: taskId,
    estado: "cerrada"
  });

  return sesiones.reduce((acc, s) => acc + (s.tiempoTrabajadoHoras || 0), 0);
}

/**
 * Busca los desarrolladores más afines a una tarea,
 * considerando categoría, habilidades, dificultad, rendimiento previo
 * y una lista opcional de desarrolladores disponibles.
 */
export async function buscarDesarrolladoresSimilares(taskId, devDisponibles = []) {
  const tareaNueva = await Task.findById(taskId).lean();
  if (!tareaNueva) throw new Error("Tarea no encontrada");

  // Traer logs de tareas completadas
  const logs = await TaskLog.find({ estado: "completada" })
    .populate("tarea desarrollador")
    .lean();

  const coincidencias = [];

  for (const log of logs) {
    const tareaAntigua = log.tarea;
    const dev = log.desarrollador;
    if (!tareaAntigua || !dev) continue;

    // 🚧 Si se pasó un listado de dev disponibles, filtrar aquí
    if (devDisponibles.length > 0 && !devDisponibles.includes(dev._id.toString())) {
      continue;
    }

    // --- Comparaciones por criterio ---

    // 1️⃣ Categoría (peso fuerte)
    const mismaCategoria =
      tareaAntigua.categoria === tareaNueva.categoria ? 1 : 0;

    // 2️⃣ Habilidades técnicas
    const coincidenciasHabilidades = tareaAntigua.habilidadesRequeridas.filter(
      (h) => tareaNueva.habilidadesRequeridas.includes(h)
    ).length;
    const porcentajeHabilidades =
      coincidenciasHabilidades / tareaNueva.habilidadesRequeridas.length;

    // 3️⃣ Dificultad
    const diffDif = Math.abs(
      (tareaAntigua.dificultad || 0) - (tareaNueva.dificultad || 0)
    );
    const similitudDificultad = 1 - diffDif / 5; // normaliza entre 0–1

    // --- Similitud total ponderada ---
    const similitudTotal =
      mismaCategoria * 0.5 + porcentajeHabilidades * 0.3 + similitudDificultad * 0.2;

    if (similitudTotal >= 0.3) {
      coincidencias.push({
        devId: dev._id.toString(),
        nombre: dev.nombre,
        similitud: Number(similitudTotal.toFixed(2)),
        puntuacion: log.puntuacionCalidad || 0,
      });
    }
  }

  // Agrupar por desarrollador
  const resumenPorDev = coincidencias.reduce((acc, curr) => {
    if (!acc[curr.devId]) {
      acc[curr.devId] = {
        devId: curr.devId,
        nombre: curr.nombre,
        similitudPromedio: curr.similitud,
        puntuaciones: [curr.puntuacion],
      };
    } else {
      acc[curr.devId].similitudPromedio =
        (acc[curr.devId].similitudPromedio + curr.similitud) / 2;
      acc[curr.devId].puntuaciones.push(curr.puntuacion);
    }
    return acc;
  }, {});

  const resultadoFinal = Object.values(resumenPorDev).map((dev) => ({
    ...dev,
    puntuacionPromedio:
      dev.puntuaciones.reduce((a, b) => a + b, 0) / dev.puntuaciones.length,
  }));

  // 🔹 Ordenar por puntuación promedio y similitud
  resultadoFinal.sort((a, b) => {
    if (b.puntuacionPromedio === a.puntuacionPromedio) {
      return b.similitudPromedio - a.similitudPromedio;
    }
    return b.puntuacionPromedio - a.puntuacionPromedio;
  });

  return resultadoFinal;
}


/**
 * Actualiza los TaskLog existentes para agregar o asignar el campo 'puntuacionCalidad'.
 * Si no existe, se agrega; si existe, se deja igual.
 * También puede asignar un valor automático según el estado de la tarea.
 */
export async function actualizarPuntuacionCalidad() {
  try {

    // 🔹 Obtener todos los registros
    const taskLogs = await TaskLog.find();
    console.log(`🔍 Registros encontrados: ${taskLogs.length}`);

    let actualizados = 0;

    for (const log of taskLogs) {
      // Si ya tiene puntuación, no se modifica
      if (log.puntuacionCalidad !== undefined && log.puntuacionCalidad !== null)
        continue;

      // Asignar valor automático según el estado
      let puntaje = 3; // valor por defecto
      switch (log.estado) {
        case "adelantada":
          puntaje = 5;
          break;
        case "completada":
          puntaje = 4;
          break;
        case "retrasada":
          puntaje = 2;
          break;
        case "cancelada":
          puntaje = 1;
          break;
      }

      log.puntuacionCalidad = puntaje;
      await log.save();
      actualizados++;
    }

    console.log(`✅ TaskLogs actualizados: ${actualizados}`);

  } catch (error) {
    console.error("❌ Error al actualizar los TaskLogs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de la base de datos");
  }
}

//obtener taskLogs de un desarrollador
export async function getTaskLogsByDeveloper(developerId) {
  return await TaskLog.find({ desarrollador: developerId });
}