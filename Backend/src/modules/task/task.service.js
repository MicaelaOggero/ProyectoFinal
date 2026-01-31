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

export async function iniciarTareaService(taskId, userId) {
  
  //Buscar la tarea
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) {
    throw new Error("Tarea no encontrada");
  }

  //validar que el proyecto esté en curso
  const proyecto = await Project.findById(tarea.proyecto);
  if (!proyecto || proyecto.estado !== "en curso") {
    throw new Error("Proyecto no encontrado o no está en curso");
  }

  //Buscar el desarrollador
  const desarrollador = await User.findById(userId);
  if (!desarrollador) {
    throw new Error("Desarrollador no encontrado");
  }

  //validar que el desarrollador sea el asignado a la tarea
  if (tarea.desarrolladorAsignado.toString() !== desarrollador._id.toString()) {
    throw new Error("No estás asignado a esta tarea");
  }

  //Validar estado actual
  if (tarea.estado !== "pendiente" && tarea.estado !== "pausada") {
    throw new Error("Solo se pueden iniciar tareas en estado 'pendiente'");
  }

  tarea.estado = "en curso";

  //Actualizar fecha de inicio real
  tarea.fechaRealInicio = new Date();

  //Registrar tiempo de inicio
  tarea.enTrabajoDesde = new Date();

  //Actualizar historial
  tarea.historial.push({
    campo: "estado",
    valorAnterior: "pendiente",
    valorNuevo: "en curso",
    cambiadoPor: desarrollador._id,
    fechaCambio: new Date()
  });

  await saveTask(tarea);
  return tarea;
}

export async function pausarOCompletarTarea(taskId, userId, accion = "pausar") {
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  const desarrollador = await User.findById(userId);
  if (!desarrollador) throw new Error("Desarrollador no encontrado");

  if (tarea.desarrolladorAsignado.toString() !== desarrollador._id.toString()) {
    throw new Error("No estás asignado a esta tarea");
  }

  if (tarea.estado !== "en curso") {
    throw new Error("Solo se pueden pausar o completar tareas en curso");
  }

  let nuevoPromedio = null; // 👈 declarar antes

  // 🔹 Calcular tiempo trabajado
  if (tarea.enTrabajoDesde) {
    const ahora = new Date();
    const diffMs = ahora - tarea.enTrabajoDesde;
    const minutosTrabajados = Math.round(diffMs / 60000);
    tarea.tiempoInvertidoHoras += minutosTrabajados;
    tarea.enTrabajoDesde = null;
  }

  if (accion === "completar") {
    tarea.estado = "completada";
    tarea.fechaRealFin = new Date();

    const estadoFinal =
      tarea.tiempoInvertidoHoras > tarea.tiempoEstimadoHoras
        ? "retrasada"
        : tarea.tiempoInvertidoHoras < tarea.tiempoEstimadoHoras
          ? "adelantada"
          : "completada";

    // 1) Crear TaskLog
    const log = await TaskLog.create({
      proyecto: tarea.proyecto?._id ?? tarea.proyecto,
      tarea: tarea._id,
      desarrollador: userId,
      duracionEstimadaHoras: tarea.tiempoEstimadoHoras,
      tiempoInvertidoHoras: tarea.tiempoInvertidoHoras,
      estado: estadoFinal,
      puntuacionCalidad: null,
    });

    // 2) Buscar admin desde el proyecto
    const proyecto = await Project.findById(tarea.proyecto?._id ?? tarea.proyecto).select("administrador");
    if (!proyecto?.administrador) {
      throw new Error("El proyecto no tiene administrador asignado");
    }

    // 3) Crear notificación
    await Notification.create({
      receptor: proyecto.administrador,
      emisor: userId,
      tipo: "CALIFICAR_TAREA",
      proyecto: proyecto._id,
      tarea: tarea._id,
      taskLog: log._id,
      titulo: "Tarea completada: requiere calificación",
      mensaje: `El desarrollador completó una tarea y requiere puntuación de calidad.`,
    });
    
    // 4) actualizar rendimiento
    nuevoPromedio = await actualizarRendimientoDesarrollador(userId);
  }

  //si la accion es pausar
  if (accion === "pausar") {
    tarea.estado = "pausada";

  }
  //Actualizar historial

  tarea.historial.push({
    campo: "estado",
    valorAnterior: "en curso",
    valorNuevo: tarea.estado,
    cambiadoPor: userId,
    fechaCambio: new Date()
  });

  await saveTask(tarea);

  return {
    message: `Tarea ${accion === "completar" ? "completada" : "pausada"} correctamente`,
    horasTotales: tarea.tiempoInvertidoHoras.toFixed(2),
    rendimientoActualizado: nuevoPromedio !== null
      ? nuevoPromedio.toFixed(2)
      : null
  };
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