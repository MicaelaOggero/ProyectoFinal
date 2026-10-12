import OpenAI from "openai";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "./project.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { normalizarListaHabilidades } from "../../utils/asignacionBasica/normalizarHabilidad.js";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = ["frontend", "backend", "testing", "documentacion", "machine learning"];
const PRIORITIES = ["alta", "media", "baja"];

function validateProjectId(projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("projectId invalido");
  }
}

async function getAuthorizedProject(projectId, adminId) {
  validateProjectId(projectId);

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Proyecto no encontrado");

  if (String(project.administrador) !== String(adminId)) {
    throw new Error("No tenes permisos para modificar este proyecto");
  }

  if (!project.generarTareasConIA) {
    throw new Error("La generacion de tareas con IA no esta habilitada para este proyecto");
  }

  if (project.tareasGeneradasConIA) {
    throw new Error("Este proyecto ya tiene tareas generadas con IA");
  }

  return project;
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeTask(task, project) {
  const description = String(task?.descripcion || "").trim();
  const skills = Array.isArray(task?.habilidadesRequeridas)
    ? normalizarListaHabilidades(task.habilidadesRequeridas.map(String))
    : [];
  const category = CATEGORIES.includes(task?.categoria) ? task.categoria : null;
  const priority = PRIORITIES.includes(task?.prioridad) ? task.prioridad : null;
  const difficulty = Number(task?.nivelDificultad);
  const estimatedHours = Number(task?.tiempoEstimadoHoras);

  if (!description) throw new Error("Una tarea generada no tiene descripcion");
  if (!skills.length) throw new Error("La tarea '" + description + "' no tiene habilidades requeridas");
  if (!category) throw new Error("Categoria invalida en la tarea '" + description + "'");
  if (!priority) throw new Error("Prioridad invalida en la tarea '" + description + "'");
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new Error("Nivel de dificultad invalido en la tarea '" + description + "'");
  }
  if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) {
    throw new Error("Tiempo estimado invalido en la tarea '" + description + "'");
  }

  const projectStart = new Date(project.fechaInicioEstimada);
  const projectEnd = new Date(project.fechaFinEstimada);
  let startDate = validDate(task.fechaEstimadaInicio) || projectStart;
  let endDate = validDate(task.fechaEstimadaFin) || projectEnd;

  if (startDate < projectStart || startDate > projectEnd) startDate = projectStart;
  if (endDate > projectEnd || endDate < startDate) endDate = projectEnd;

  return {
    descripcion: description,
    habilidadesRequeridas: skills,
    categoria: category,
    nivelDificultad: difficulty,
    prioridad: priority,
    proyecto: project._id,
    tiempoEstimadoHoras: estimatedHours,
    fechaEstimadaInicio: startDate,
    fechaEstimadaFin: endDate,
    desarrolladorAsignado: null,
    asignada: false,
    estado: "pendiente"
  };
}

async function getAvailableDeveloperSkills() {
  const developers = await User.find({ rol: "user" }).select("habilidades").lean();
  return normalizarListaHabilidades(
    developers.flatMap((developer) =>
      (developer.habilidades || []).map((skill) => skill.nombre)
    )
  );
}

function extractTasks(text) {
  const cleanText = text.replace(new RegExp("\\x60\\x60\\x60json|\\x60\\x60\\x60", "g"), "").trim();
  const parsed = JSON.parse(cleanText);
  const tasks = Array.isArray(parsed) ? parsed : parsed.tareas;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error("La IA no devolvio tareas validas");
  }

  return tasks;
}

export async function previewTasksWithAIService(projectId, adminId) {
  const project = await getAuthorizedProject(projectId, adminId);

  if (!project.descripcion?.trim()) {
    throw new Error("El proyecto necesita una descripcion para generar tareas con IA");
  }

  const availableDeveloperSkills = await getAvailableDeveloperSkills();

  const prompt = [
    "Genera todas las tareas necesarias para ejecutar este proyecto.",
    "Devuelve unicamente JSON valido con este formato: {\"tareas\":[...]}",
    "No asignes desarrolladores.",
    "Estas son habilidades actualmente presentes en los desarrolladores: " + (availableDeveloperSkills.join(", ") || "ninguna registrada"),
    "Usalas cuando sean adecuadas, pero no limites la solucion a esta lista: si el proyecto necesita una habilidad que no esta disponible, incluyela igualmente.",
    "Usa nombres claros y consistentes para las habilidades, evitando sinonimos innecesarios.",
    "Cada tarea debe incluir: descripcion, habilidadesRequeridas, categoria, nivelDificultad, prioridad, tiempoEstimadoHoras, fechaEstimadaInicio y fechaEstimadaFin.",
    "categoria debe ser uno de: " + CATEGORIES.join(", "),
    "prioridad debe ser una de: " + PRIORITIES.join(", "),
    "nivelDificultad debe ser un entero de 1 a 5.",
    "Las fechas deben estar dentro del rango del proyecto.",
    "",
    "Nombre: " + project.nombre,
    "Descripcion: " + project.descripcion,
    "Fecha inicial: " + new Date(project.fechaInicioEstimada).toISOString(),
    "Fecha final: " + new Date(project.fechaFinEstimada).toISOString()
  ].join("\n");

  const completion = await client.responses.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    input: prompt
  });

  let tasks;
  try {
    tasks = extractTasks(completion.output_text);
  } catch {
    throw new Error("La respuesta de la IA no fue un JSON valido de tareas");
  }

  return {
    projectId: project._id,
    generarTareasConIA: project.generarTareasConIA,
    tareas: tasks.map((task) => normalizeTask(task, project))
  };
}

export async function confirmTasksWithAIService(projectId, adminId, payload) {
  const project = await getAuthorizedProject(projectId, adminId);
  const tasks = Array.isArray(payload?.tareas) ? payload.tareas : [];

  if (!tasks.length) {
    throw new Error("Debe enviar un array de tareas para confirmar");
  }

  const existingTasks = await Task.exists({ proyecto: project._id });
  if (existingTasks) {
    throw new Error("El proyecto ya tiene tareas. No se generaron tareas nuevas para evitar duplicados");
  }

  const normalizedTasks = tasks.map((task) => normalizeTask(task, project));
  const createdTasks = await Task.insertMany(normalizedTasks);

  project.tareasGeneradasConIA = true;
  project.fechaGeneracionTareasIA = new Date();
  await project.save();

  return {
    message: "Tareas generadas con IA confirmadas correctamente",
    projectId: project._id,
    cantidad: createdTasks.length,
    tareas: createdTasks
  };
}

