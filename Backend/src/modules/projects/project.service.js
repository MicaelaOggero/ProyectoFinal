import * as projectDao from "./project.dao.js";
import Project from "./project.model.js";
import Task from "../task/task.model.js";
import * as userDao from "../users/user.dao.js";
import { crearNotificacionFeedbackProyecto } from "../notifications/notification.service.js";
import User from "../users/user.model.js";
import Notification from "../notifications/notification.model.js";
import { saveProjectFinalReport } from "../reports/report.service.js";
import { createFeedback } from "../performanceFeedback/performanceFeedback.dao.js";

// Obtener proyectos por administrador
export const getProjects = async (adminId) => {
  return await projectDao.findByAdmin(adminId);
};

// Obtener un proyecto por ID
export const getProjectById = async (id) => {
  return await projectDao.findById(id);
};

// Crear un nuevo proyecto
export const createProject = async (projectData, adminId) => {
  const { nombre, descripcion, fechaInicioEstimada, fechaFinEstimada, nivelDificultad, prioridad, estado } = projectData;

  return await projectDao.create({
    nombre,
    descripcion,
    fechaInicioEstimada,
    fechaFinEstimada,
    nivelDificultad,
    prioridad,
    estado,
    administrador: adminId,
  });
};

// Actualizar un proyecto por ID
export const updateProject = async (id, updatedData) => {
  return await projectDao.update(id, updatedData);
};

// Eliminar un proyecto por ID
export const deleteProject = async (id) => {
  return await projectDao.remove(id);
};

function aMinutos(valorHoras) {
  const h = Number(valorHoras) || 0;
  return Math.round(h * 60);
}

export function recalcularTotalesProyectoDesdeTareas(tareas) {
  let estimadoHoras = 0;
  let invertidoMin = 0;

  for (const t of tareas) {
    estimadoHoras += Number(t.tiempoEstimadoHoras) || 0;
    invertidoMin += aMinutos(t.tiempoInvertidoHoras);
  }

  return {
    tiempoEstimadoTotalHoras: estimadoHoras,
    tiempoInvertidoTotalMinutos: invertidoMin,
  };
}


/**
 * Marca un proyecto como iniciado
 * @param {String} projectId - ID del proyecto
 */
export async function iniciarProyectoService(projectId, userId) {
  const proyecto = await projectDao.findById(projectId);
  if (!proyecto) {
    throw new Error("Proyecto no encontrado");
  }

  const user = await userDao.findUserById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Si ya estaba iniciado, evitamos duplicar
  if (proyecto.estado === "activo") {
    throw new Error("El proyecto ya está iniciado");
  }

  // 🔹 Validar estado actual
  if (proyecto.estado !== "pendiente" && proyecto.estado !== "pausado") {
    throw new Error("Solo se pueden iniciar proyectos pendientes o pausados");
  }

  // Verificar si tiene tareas asociadas
  const tareas = await Task.find({ proyecto: projectId });
  if (!tareas || tareas.length === 0) {
    throw new Error("No se puede iniciar un proyecto sin tareas asociadas");
  }

  //Verificar que todas las tareas estén asignadas
  const tareasSinAsignar = tareas.filter(tarea => !tarea.desarrolladorAsignado);
  if (tareasSinAsignar.length > 0) {
    throw new Error("No se puede iniciar el proyecto mientras haya tareas sin asignar");
  }

  // Actualizar estado y fecha de inicio 
  proyecto.fechaInicioReal = new Date(); // 🔹 fecha actual
  proyecto.estado = "en curso";

  proyecto.enTrabajoDesde = new Date();

  // Actualizar historial
  proyecto.historial.push({
    accion: "Inicio de proyecto",
    usuario: userId,
    descripcion: `El proyecto fue iniciado por el usuario ${user.nombre}`,
  });

  await proyecto.save();
  return proyecto;
}


/**
 * Pausa un proyecto en curso y registra el cambio en su historial.
 * @param {String} projectId - ID del proyecto
 * @param {String} userId - ID del usuario que realiza la acción
 */
export async function pausarProyectoService(projectId, userId) {
  const proyecto = await Project.findById(projectId);
  if (!proyecto) throw new Error("Proyecto no encontrado");

  // 🔹 Validar estado actual
  if (proyecto.estado !== "en curso") {
    throw new Error("Solo se pueden pausar proyectos en curso");
  }

  // 🔹 Verificar si tiene tareas en curso
  const tareasEnCurso = await Task.find({ tarea: projectId, estado: "en curso" });
  if (tareasEnCurso.length) {
    throw new Error("No se pueden pausar el proyecto mientras haya tareas en curso");
  }

  if (proyecto.enTrabajoDesde) {
    const ahora = new Date();
    const diffMs = ahora - proyecto.enTrabajoDesde;
    const minutosTrabajados = Math.round(diffMs / 60000);

    proyecto.tiempoActivoMinutos += minutosTrabajados;

    proyecto.enTrabajoDesde = null;
  }

  // 🔹 Actualizar estado y agregar entrada al historial
  proyecto.estado = "pausado";
  proyecto.historial.push({
    accion: "Pausa de proyecto",
    usuario: userId,
    descripcion: `El proyecto fue pausado por el usuario ${userId}`
  });

  await proyecto.save();

  return proyecto;
}

export async function finalizarProyectoService(projectId, userId) {
  const proyecto = await Project.findById(projectId);
  if (!proyecto) throw new Error("Proyecto no encontrado");
  // 🔹 Validar estado actual
  if (proyecto.estado !== "en curso" && proyecto.estado !== "pausado") {
    throw new Error("Solo se pueden finalizar proyectos en curso");
  }
  // 🔹 Verificar si todas las tareas están completadas
  const tareasIncompletas = await Task.find({ proyecto: projectId, estado: { $ne: "completada" } });
  if (tareasIncompletas.length) {
    throw new Error("No se pueden finalizar el proyecto mientras haya tareas incompletas");
  }

  if (proyecto.enTrabajoDesde) {
    const ahora = new Date();
    const diffMs = ahora - proyecto.enTrabajoDesde;
    const minutosTrabajados = Math.round(diffMs / 60000);

    proyecto.tiempoActivoMinutos += minutosTrabajados;

    proyecto.enTrabajoDesde = null;
  }

  // 🔹 Actualizar estado y fecha de finalización
  proyecto.estado = "finalizado";
  proyecto.fechaFinReal = new Date();
  proyecto.historial.push({
    accion: "Finalización de proyecto",
    usuario: userId,
    descripcion: `El proyecto fue finalizado por el usuario ${userId}`
  });

  // 🔹 Recalcular totales desde tareas (estimado e invertido)
  const tareas = await Task.find({ proyecto: projectId });
  const { tiempoEstimadoTotalHoras, tiempoInvertidoTotalMinutos } =
    recalcularTotalesProyectoDesdeTareas(tareas);

  proyecto.tiempoEstimadoTotalHoras = tiempoEstimadoTotalHoras;
  proyecto.tiempoInvertidoTotalMinutos = tiempoInvertidoTotalMinutos;

  await proyecto.save();

  // ✅ Crear notificación para calificar devs
  await crearNotificacionFeedbackProyecto(projectId);

  saveProjectFinalReport(proyecto._id);

  return proyecto;
}

// services/proyectoFeedback.service.js

export async function calificarDesarrolladoresProyectoService(
  projectId,
  adminId,
  calificaciones,
  notificationId = null
) {
  const proyecto = await Project.findById(projectId);
  if (!proyecto) throw new Error("Proyecto no encontrado");

  // 🔐 Seguridad: solo el admin del proyecto
  if (String(proyecto.administrador) !== String(adminId)) {
    throw new Error("No tenés permisos para calificar este proyecto");
  }

  if (proyecto.puntajeCalidad != null) {
    throw new Error("El proyecto ya fue calificado anteriormente");
  }

  if (proyecto.estado !== "finalizado") {
    throw new Error("Solo se puede calificar cuando el proyecto está finalizado");
  }

  if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
    throw new Error("calificaciones debe ser un array con al menos un elemento");
  }

  // Validación básica
  for (const c of calificaciones) {
    if (!c?.desarrolladorId) {
      throw new Error("Falta desarrolladorId en una calificación");
    }
    const p = Number(c?.puntuacion);
    if (!Number.isFinite(p) || p < 1 || p > 5) {
      throw new Error(`Puntuación inválida para ${c.desarrolladorId}. Debe ser 1 a 5`);
    }
  }

  const updates = [];

  // 🔄 Actualizar feedbackHistorico de cada dev
  for (const c of calificaciones) {
    const dev = await User.findById(c.desarrolladorId);
    if (!dev) throw new Error(`Desarrollador no encontrado: ${c.desarrolladorId}`);

    const prevProm = Number(dev.feedbackHistorico?.puntuacionPromedio ?? 0);
    const prevCount = Number(dev.feedbackHistorico?.vecesCalificado ?? 0);

    const nuevoCount = prevCount + 1;
    const nuevoProm = ((prevProm * prevCount) + Number(c.puntuacion)) / nuevoCount;

    dev.feedbackHistorico = {
      puntuacionPromedio: Number(nuevoProm.toFixed(2)),
      vecesCalificado: nuevoCount
    };

    await dev.save();

    updates.push({
      desarrolladorId: dev._id,
      puntuacion: Number(c.puntuacion),
      feedbackHistorico: dev.feedbackHistorico
    });

    await createFeedback({
      proyecto: projectId,
      desarrollador: dev._id,
      administrador: adminId,
      puntuacion: Number(c.puntuacion),
      comentario: c.comentario || ""
    });

    // 🔔 Crear notificación de calificación recibida para el de
    await Notification.create({
      receptor: dev._id,
      emisor: adminId,
      tipo: "CALIFICACION_RECIBIDA",
      proyecto: projectId,
      titulo: "Has recibido una calificación",
      mensaje: `Tu desempeño en el proyecto "${proyecto.nombre}" ha sido calificado con ${c.puntuacion} estrellas. ¡Sigue así!`
    });
  }

  // 🔔 Actualizar notificación de proyecto (si se envía)
  // -------------------------------------
  // 🔹 Calcular puntaje de calidad del proyecto
  // -------------------------------------
  if (Array.isArray(calificaciones) && calificaciones.length > 0) {
    const sumaCalificaciones = calificaciones.reduce(
      (sum, c) => sum + Number(c.puntuacion),
      0
    );

    const promedioCalificaciones =
      sumaCalificaciones / calificaciones.length;

    proyecto.puntajeCalidad = Number(promedioCalificaciones.toFixed(2));
    await proyecto.save();
  }

  // -------------------------------------
  // 🔹 Resolver notificación (si existe)
  // -------------------------------------
  if (notificationId) {
    const notif = await Notification.findById(notificationId);

    if (
      notif &&
      String(notif.receptor) === String(adminId) &&
      notif.tipo === "CALIFICAR_PROYECTO_LOTE"
    ) {
      const map = new Map(
        calificaciones.map(c => [
          String(c.desarrolladorId),
          Number(c.puntuacion),
        ])
      );

      notif.data.desarrolladores = (notif.data.desarrolladores || []).map(d => ({
        ...d,
        puntuacion: map.has(String(d.desarrolladorId))
          ? map.get(String(d.desarrolladorId))
          : d.puntuacion,
        calificadoEn: map.has(String(d.desarrolladorId))
          ? new Date()
          : d.calificadoEn,
      }));

      notif.resuelta = true;
      notif.resueltaEn = new Date();

      await notif.save();
    }
  }

  return {
    ok: true,
    projectId,
    actualizados: updates.length,
    detalle: updates
  };
}

