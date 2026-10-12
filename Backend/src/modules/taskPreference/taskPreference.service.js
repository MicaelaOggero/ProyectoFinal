import mongoose from "mongoose";
import Task from "../task/task.model.js";
import TaskLog from "../task/taskLog.model.js";
import User from "../users/user.model.js";
import TaskPreferenceRating from "./taskPreferenceRating.model.js";
import Notification from "../notifications/notification.model.js";
import { normalizarHabilidad } from "../../utils/asignacionBasica/normalizarHabilidad.js";

const COMPLETED_STATES = ["completada", "retrasada", "adelantada"];
const PREFERENCE_NOTIFICATION_TYPE = "CALIFICAR_PREFERENCIAS_TAREAS";

async function assertDeveloper(developerId) {
  const developer = await User.findById(developerId).select("rol").lean();
  if (!developer) throw new Error("Desarrollador no encontrado");
  if (developer.rol !== "user") {
    throw new Error("Solo los desarrolladores pueden calificar tareas");
  }
}

function validateTaskId(taskId) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new Error("taskId invalido");
  }
}

async function getTaskForDeveloper(taskId, developerId) {
  validateTaskId(taskId);

  const task = await Task.findById(taskId).lean();
  if (!task) throw new Error("Tarea no encontrada");

  const assignedToDeveloper = String(task.desarrolladorAsignado) === String(developerId);
  const participationLog = await TaskLog.exists({
    tarea: task._id,
    desarrollador: developerId,
    estado: { $in: COMPLETED_STATES }
  });

  if (!assignedToDeveloper && !participationLog) {
    throw new Error("Solo podes calificar tareas en las que participaste");
  }

  const completedByTask = COMPLETED_STATES.includes(task.estado);
  if (!completedByTask && !participationLog) {
    throw new Error("La tarea debe estar completada para poder calificarla");
  }

  if (!Array.isArray(task.habilidadesRequeridas) || !task.habilidadesRequeridas.length) {
    throw new Error("La tarea no tiene habilidades requeridas para actualizar preferencias");
  }

  return task;
}

export async function getPendingTaskPreferenceRatings(developerId) {
  await assertDeveloper(developerId);

  const logs = await TaskLog.find({ desarrollador: developerId }).select("tarea").lean();
  const loggedTaskIds = logs.map((log) => log.tarea).filter(Boolean);

  const tasks = await Task.find({
    $or: [
      { desarrolladorAsignado: developerId },
      { _id: { $in: loggedTaskIds } }
    ],
    estado: { $in: COMPLETED_STATES }
  }).populate("proyecto", "nombre").lean();

  const ratings = await TaskPreferenceRating.find({
    desarrollador: developerId,
    tarea: { $in: tasks.map((task) => task._id) }
  }).select("tarea").lean();

  const ratedTaskIds = new Set(ratings.map((rating) => String(rating.tarea)));
  return tasks.filter((task) => !ratedTaskIds.has(String(task._id)));
}

export async function rateTaskForPreferences({ taskId, developerId, puntuacion, comentario }) {
  await assertDeveloper(developerId);

  const score = Number(puntuacion);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("La puntuacion debe ser un numero entero entre 1 y 5");
  }

  const task = await getTaskForDeveloper(taskId, developerId);

  const alreadyRated = await TaskPreferenceRating.exists({
    tarea: task._id,
    desarrollador: developerId
  });
  if (alreadyRated) {
    throw new Error("Ya calificaste esta tarea");
  }

  const rating = await TaskPreferenceRating.create({
    tarea: task._id,
    proyecto: task.proyecto,
    desarrollador: developerId,
    puntuacion: score,
    comentario: String(comentario || "").trim()
  });

  const developer = await User.findById(developerId);
  if (!developer) throw new Error("Desarrollador no encontrado");

  const updatedPreferences = developer.preferenciasHabilidad || [];
  const normalizedSkills = [
    ...new Set(task.habilidadesRequeridas.map(normalizarHabilidad).filter(Boolean))
  ];

  for (const skill of normalizedSkills) {
    const preference = updatedPreferences.find(
      (item) => normalizarHabilidad(item.habilidad) === skill
    );

    if (preference) {
      const count = Number(preference.vecesCalificado || 0);
      const average = Number(preference.puntuacionPromedio || 0);
      preference.puntuacionPromedio = Number(
        (((average * count) + score) / (count + 1)).toFixed(2)
      );
      preference.vecesCalificado = count + 1;
      preference.habilidad = skill;
    } else {
      updatedPreferences.push({
        habilidad: skill,
        puntuacionPromedio: score,
        vecesCalificado: 1
      });
    }
  }

  developer.preferenciasHabilidad = updatedPreferences;
  await developer.save();

  return {
    rating,
    preferenciasHabilidad: developer.preferenciasHabilidad
  };
}

export async function crearNotificacionesTareasPendientes(projectId, emisorId) {
  const tasks = await Task.find({
    proyecto: projectId,
    estado: { $in: COMPLETED_STATES }
  }).select("_id desarrolladorAsignado").lean();

  const logs = await TaskLog.find({
    proyecto: projectId,
    estado: { $in: COMPLETED_STATES }
  }).select("tarea desarrollador").lean();

  const tasksById = new Map(tasks.map((task) => [String(task._id), task]));
  const tasksByDeveloper = new Map();

  const addTaskForDeveloper = (developerId, taskId) => {
    if (!developerId || !tasksById.has(String(taskId))) return;
    const key = String(developerId);
    if (!tasksByDeveloper.has(key)) tasksByDeveloper.set(key, new Set());
    tasksByDeveloper.get(key).add(String(taskId));
  };

  for (const task of tasks) {
    addTaskForDeveloper(task.desarrolladorAsignado, task._id);
  }

  for (const log of logs) {
    addTaskForDeveloper(log.desarrollador, log.tarea);
  }

  const taskIds = [...tasksById.keys()];
  const ratings = await TaskPreferenceRating.find({
    proyecto: projectId,
    tarea: { $in: taskIds }
  }).select("tarea desarrollador").lean();

  const ratedByDeveloper = new Map();
  for (const rating of ratings) {
    const key = String(rating.desarrollador);
    if (!ratedByDeveloper.has(key)) ratedByDeveloper.set(key, new Set());
    ratedByDeveloper.get(key).add(String(rating.tarea));
  }

  const created = [];

  for (const [developerId, developerTaskIds] of tasksByDeveloper) {
    const ratedTaskIds = ratedByDeveloper.get(developerId) || new Set();
    const pendingCount = [...developerTaskIds]
      .filter((taskId) => !ratedTaskIds.has(taskId)).length;

    if (!pendingCount) continue;

    const existing = await Notification.findOne({
      receptor: developerId,
      proyecto: projectId,
      tipo: PREFERENCE_NOTIFICATION_TYPE,
      resuelta: false
    }).select("_id").lean();

    if (existing) continue;

    const notification = await Notification.create({
      receptor: developerId,
      emisor: emisorId,
      tipo: PREFERENCE_NOTIFICATION_TYPE,
      proyecto: projectId,
      titulo: "Califica las tareas en las que participaste",
      mensaje: `Tenes ${pendingCount} tarea(s) pendiente(s) de calificar para actualizar tus preferencias de habilidades.`,
      leida: false,
      resuelta: false
    });

    created.push(notification);
  }

  return created;
}
