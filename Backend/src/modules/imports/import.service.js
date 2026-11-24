import { randomUUID } from "node:crypto";
import User from "../users/user.model.js";
import Habilidad from "../skills/skills.model.js";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js";
import Company from '../companies/company.model.js';
import { createHash } from "../../utils/utils.js";
import { normalizarHabilidad, normalizarListaHabilidades } from "../../utils/asignacionBasica/normalizarHabilidad.js";

const CATEGORIES = ["frontend", "backend", "testing", "documentacion", "machine learning"];
const PRIORITIES = ["alta", "media", "baja"];

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new Error(`El campo '${field}' debe ser un array`);
  return value;
}

function requiredString(value, field) {
  const result = String(value || "").trim();
  if (!result) throw new Error(`El campo '${field}' es obligatorio`);
  return result;
}

function parseDate(value, field) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(`La fecha '${field}' no es valida`);
  }
  return date;
}

function mapSkills(value) {
  const skills = Array.isArray(value) ? value : [];
  return normalizarListaHabilidades(
    skills.map((skill) => typeof skill === "string" ? skill : skill?.nombre)
  );
}

async function obtenerAdministrador(adminId) {
  const admin = await User.findById(adminId).select('rol empresa').lean();
  if (!admin || admin.rol !== 'admin') throw new Error('No autorizado');
  if (admin.empresa && !(await Company.exists({ _id: admin.empresa, activa: true }))) throw new Error('La empresa no está habilitada');
  return admin;
}

export async function importDevelopers(developers, adminId) {
  requireArray(developers, "desarrolladores");
  const admin = await obtenerAdministrador(adminId);
  const results = [];

  for (const data of developers) {
    const email = requiredString(data.email, "email").toLowerCase();
    const skills = mapSkills(data.habilidades);
    const skillObjects = skills.map((nombre) => {
      const original = Array.isArray(data.habilidades)
        ? data.habilidades.find((skill) => normalizarHabilidad(typeof skill === "string" ? skill : skill?.nombre) === nombre)
        : null;
      const nivel = Number(typeof original === "object" ? original?.nivel : 1);
      return { nombre, nivel: Number.isInteger(nivel) && nivel >= 1 && nivel <= 5 ? nivel : 1 };
    });

    const existing = await User.findOne({ email });
    if (existing && (existing.rol !== 'user' || String(existing.empresa ?? '') !== String(admin.empresa ?? ''))) {
      throw new Error('El correo ya pertenece a otra cuenta o empresa');
    }
    const payload = {
      nombre: requiredString(data.nombre, "nombre"),
      apellido: String(data.apellido || "").trim(),
      dni: String(data.dni || "").trim(),
      rol: "user",
      habilidades: skillObjects,
      aniosExperiencia: Number(data.aniosExperiencia || 0),
      costoPorHora: Number(data.costoPorHora || 0),
      calendario: Array.isArray(data.calendario) ? data.calendario : []
    };

    let user;
    let action;
    if (existing) {
      user = await User.findByIdAndUpdate(existing._id, { $set: payload }, { new: true, runValidators: true }).select("-password");
      action = "actualizado";
    } else {
      user = await User.create({
        ...payload,
        email,
        empresa: admin.empresa ?? null,
        password: createHash(randomUUID())
      });
      user.password = undefined;
      action = "creado";
    }

    results.push({ email, action, id: user._id });
  }

  return { cantidad: results.length, resultados: results };
}

export async function importSkills(skills) {
  requireArray(skills, "habilidades");
  const results = [];

  for (const data of skills) {
    const nombre = normalizarHabilidad(typeof data === "string" ? data : data?.nombre);
    if (!nombre) throw new Error("Cada habilidad debe tener un nombre");

    const skill = await Habilidad.findOneAndUpdate(
      { nombre },
      { $set: { nombre, fuente: "importacion" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    results.push(skill);
  }

  return { cantidad: results.length, habilidades: results };
}

export async function importProjects(projects, adminId) {
  requireArray(projects, "proyectos");
  const admin = await obtenerAdministrador(adminId);
  const results = [];

  for (const data of projects) {
    const nombre = requiredString(data.nombre, "nombre");
    const payload = {
      nombre,
      descripcion: String(data.descripcion || "").trim(),
      fechaInicioEstimada: parseDate(data.fechaInicioEstimada, "fechaInicioEstimada"),
      fechaFinEstimada: parseDate(data.fechaFinEstimada, "fechaFinEstimada"),
      nivelDificultad: Number(data.nivelDificultad),
      prioridad: data.prioridad || "media",
      estado: data.estado || "pendiente",
      generarTareasConIA: data.generarTareasConIA === true,
      administrador: adminId,
      empresa: admin.empresa ?? null
    };

    const existing = await Project.findOne({ nombre, administrador: adminId });
    const project = existing
      ? await Project.findByIdAndUpdate(existing._id, { $set: payload }, { new: true, runValidators: true })
      : await Project.create(payload);

    results.push({ id: project._id, nombre: project.nombre, action: existing ? "actualizado" : "creado" });
  }

  return { cantidad: results.length, proyectos: results };
}

async function resolveProject(data, adminId) {
  if (data.proyectoId) {
    const project = await Project.findOne({ _id: data.proyectoId, administrador: adminId });
    if (project) return project;
  }

  if (data.proyectoNombre) {
    const project = await Project.findOne({ nombre: data.proyectoNombre, administrador: adminId });
    if (project) return project;
  }

  throw new Error("No se encontro el proyecto de la tarea o no pertenece al administrador");
}

async function resolveDeveloper(data, companyId) {
  if (!data.desarrolladorEmail && !data.desarrolladorId) return null;

  const developer = data.desarrolladorId
    ? await User.findOne({ _id: data.desarrolladorId, rol: "user", empresa: companyId ?? null })
    : await User.findOne({ email: String(data.desarrolladorEmail).toLowerCase(), rol: "user", empresa: companyId ?? null });

  if (!developer) throw new Error("No se encontro el desarrollador asignado");
  return developer;
}

export async function importTasks(tasks, adminId) {
  requireArray(tasks, "tareas");
  const admin = await obtenerAdministrador(adminId);
  const results = [];

  for (const data of tasks) {
    const project = await resolveProject(data, adminId);
    if (String(project.empresa ?? '') !== String(admin.empresa ?? '')) throw new Error('El proyecto no pertenece a tu empresa');
    const descripcion = requiredString(data.descripcion, "descripcion");
    const skills = mapSkills(data.habilidadesRequeridas);
    if (!skills.length) throw new Error(`La tarea '${descripcion}' debe tener habilidadesRequeridas`);
    if (!CATEGORIES.includes(data.categoria)) throw new Error(`Categoria invalida en la tarea '${descripcion}'`);
    if (!PRIORITIES.includes(data.prioridad)) throw new Error(`Prioridad invalida en la tarea '${descripcion}'`);

    const existing = await Task.findOne({ proyecto: project._id, descripcion });
    if (existing) {
      results.push({ id: existing._id, descripcion, action: "omitido_duplicado" });
      continue;
    }

    const developer = await resolveDeveloper(data, admin.empresa);
    const task = await Task.create({
      descripcion,
      habilidadesRequeridas: skills,
      categoria: data.categoria,
      nivelDificultad: Number(data.nivelDificultad),
      prioridad: data.prioridad,
      proyecto: project._id,
      tiempoEstimadoHoras: Number(data.tiempoEstimadoHoras),
      fechaEstimadaInicio: parseDate(data.fechaEstimadaInicio, "fechaEstimadaInicio"),
      fechaEstimadaFin: parseDate(data.fechaEstimadaFin, "fechaEstimadaFin"),
      desarrolladorAsignado: developer?._id || null,
      asignada: Boolean(developer)
    });

    results.push({ id: task._id, descripcion, action: "creado" });
  }

  return { cantidad: results.length, tareas: results };
}
