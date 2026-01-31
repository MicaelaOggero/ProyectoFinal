// services/notifications.service.js
import mongoose from "mongoose";
import Notification from "../notifications/notification.model.js";
import TaskLog from "../task/taskLog.model.js";
import Project from "../projects/project.model.js";
import { actualizarPuntuacionCalidadDesarrollador } from "../users/user.service.js"; // ajustá el path real
import Task from "../task/task.model.js";

export const calificarCalidadDesdeNotificacionService = async ({
  notificationId,
  adminId,
  puntuacionCalidad,
}) => {
  if (!notificationId) throw new Error("notificationId es requerido");
  if (!adminId) throw new Error("adminId es requerido");

  const puntaje = Number(puntuacionCalidad);
  if (!Number.isFinite(puntaje) || puntaje < 1 || puntaje > 5) {
    throw new Error("puntuacionCalidad debe ser un número entre 1 y 5");
  }

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error("notificationId inválido");
  }

  // 1) Buscar notificación
  const noti = await Notification.findById(notificationId).lean();
  if (!noti) throw new Error("Notificación no encontrada");

  // Validar que el receptor sea el admin logueado
  if (String(noti.receptor) !== String(adminId)) {
    throw new Error("No autorizado: esta notificación no te pertenece");
  }

  // 2) Buscar TaskLog
  if (!noti.taskLog) throw new Error("La notificación no tiene taskLog asociado");

  const log = await TaskLog.findById(noti.taskLog);
  if (!log) throw new Error("TaskLog no encontrado");

  // 3) Validar que el admin sea administrador del proyecto
  const proyectoId = log.proyecto?._id ?? log.proyecto;
  const proyecto = await Project.findById(proyectoId).select("administrador");
  if (!proyecto) throw new Error("Proyecto no encontrado para este TaskLog");

  if (String(proyecto.administrador) !== String(adminId)) {
    throw new Error("No autorizado: no sos administrador de este proyecto");
  }

  // 4) Guardar puntuación (si ya estaba calificado, opcionalmente bloquear)
  if (log.puntuacionCalidad != null) {
    throw new Error("Este TaskLog ya fue calificado");
  }

  log.puntuacionCalidad = puntaje;
  await log.save();

  // 5) Marcar notificación como resuelta y leída
  await Notification.findByIdAndUpdate(notificationId, {
    $set: {
      resuelta: true,
      resueltaEn: new Date(),
      leida: true,
      leidaEn: new Date(),
    },
  });

  // 6) Recalcular promedio de calidad del dev
  const promedioActualizado = await actualizarPuntuacionCalidadDesarrollador(log.desarrollador);

  return {
    taskLogId: log._id,
    proyectoId: proyectoId,
    tareaId: log.tarea,
    desarrolladorId: log.desarrollador,
    puntuacionCalidad: log.puntuacionCalidad,
    promedioCalidadDesarrollador: promedioActualizado,
    notificationId,
  };
};


export async function crearNotificacionFeedbackProyecto(projectId) {
  const proyecto = await Project.findById(projectId).select("administrador");
  if (!proyecto) throw new Error("Proyecto no encontrado");

  const adminId = proyecto.administrador;
  if (!adminId) throw new Error("El proyecto no tiene administrador asignado");

  // Devs participantes = tareas con desarrolladorAsignado
  const tareas = await Task.find({ proyecto: projectId })
    .select("desarrolladorAsignado")
    .lean();

  const devIds = [...new Set(
    tareas
      .map(t => t.desarrolladorAsignado)
      .filter(Boolean)
      .map(id => String(id))
  )];

  if (devIds.length === 0) {
    return { created: false, reason: "No hay desarrolladores asignados en tareas del proyecto" };
  }

  // ✅ Evitar duplicados: notificación pendiente por proyecto/admin
  const existente = await Notification.findOne({
    receptor: adminId,
    tipo: "CALIFICAR_PROYECTO_LOTE",   // ✅ asegurate de tenerlo en el enum
    proyecto: projectId,
    resuelta: false
  }).select("_id");

  if (existente) {
    return { created: false, reason: "Ya existe una notificación pendiente para este proyecto", notificationId: existente._id };
  }

  const notif = await Notification.create({
    receptor: adminId,
    emisor: null,
    tipo: "CALIFICAR_PROYECTO_LOTE",
    proyecto: proyecto._id,

    // ⚠️ Para que esto sea válido, tarea/taskLog deben NO ser requeridos para este tipo
    tarea: undefined,
    taskLog: undefined,

    titulo: "Calificar desempeño del equipo",
    mensaje: "El proyecto fue finalizado. Asigná una calificación (1 a 5) a cada desarrollador.",

    leida: false,
    resuelta: false,

    data: {
      proyectoId: String(proyecto._id),
      desarrolladores: devIds.map(id => ({ desarrolladorId: String(id), puntuacion: null })),
    },
  });

  return { created: true, notificationId: notif._id, devs: devIds.length };
}
