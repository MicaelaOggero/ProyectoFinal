import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../users/user.model.js';
import Project from '../projects/project.model.js';
import Task from '../task/task.model.js';
import Company from './company.model.js';
import Asignacion from '../assignment/assignment.model.js';
import { validarAsignacionesEmpresa } from './assignment.auth.js';

// Destinado a las rutas migradas; debe aplicarse también a rutas de lectura.
export async function authenticateTenant(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.cookieToken;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Sesión inválida o vencida' }); }
  if (!payload?._id) return res.status(401).json({ error: 'Sesión inválida o vencida' });
  try {
    const user = await User.findById(payload._id).select('rol empresa email').lean();
    if (!user || !['admin', 'user'].includes(user.rol) || !user.empresa) {
      return res.status(403).json({ error: 'La cuenta no pertenece a una empresa habilitada' });
    }
    const company = await Company.findById(user.empresa).select('activa').lean();
    if (!company?.activa) return res.status(403).json({ error: 'La empresa no está habilitada' });
    req.user = { _id: user._id, rol: user.rol, empresa: user.empresa, email: user.email };
    return next();
  } catch (error) { return next(error); }
}

// Un desarrollador accede al proyecto únicamente mientras tenga una tarea asignada.
export function authorizeProject(param = 'projectId') {
  return async (req, res, next) => {
    const id = req.params[param];
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Proyecto no encontrado' });
    try {
      const project = await Project.findOne({ _id: id, empresa: req.user.empresa }).select('_id').lean();
      if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
      if (req.user.rol === 'user' && !(await Task.exists({ proyecto: project._id, desarrolladorAsignado: req.user._id }))) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      return next();
    } catch (error) { return next(error); }
  };
}

export async function authorizeTask(req, res, next) {
  const id = req.params.taskId;
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Tarea no encontrada' });
  try {
    const task = await Task.findById(id).select('proyecto desarrolladorAsignado').lean();
    if (!task || !(await Project.exists({ _id: task.proyecto, empresa: req.user.empresa }))) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    if (req.user.rol === 'user' && String(task.desarrolladorAsignado) !== String(req.user._id)) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    return next();
  } catch (error) { return next(error); }
}

// Compatibilidad durante la migración: los proyectos antiguos solo son visibles
// para su administrador o para desarrolladores con una tarea asignada.
export function authorizeCurrentProject(param = 'projectId', { adminOnly = false } = {}) {
  return async (req, res, next) => {
    const id = req.params[param];
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Proyecto no encontrado' });
    try {
      const user = await User.findById(req.user?._id).select('rol empresa').lean();
      if (!user || !['admin', 'user'].includes(user.rol) || (adminOnly && user.rol !== 'admin')) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      if (user.empresa) {
        const company = await Company.findById(user.empresa).select('activa').lean();
        if (!company?.activa) return res.status(403).json({ error: 'La empresa no está habilitada' });
      }
      const project = await Project.findOne({ _id: id, empresa: user.empresa ?? null }).select('_id administrador').lean();
      if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
      if (user.rol === 'admin' && !user.empresa && String(project.administrador) !== String(user._id)) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      if (user.rol === 'user' && !(await Task.exists({ proyecto: project._id, desarrolladorAsignado: user._id }))) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      req.user = { ...req.user, _id: user._id, rol: user.rol, empresa: user.empresa ?? null };
      return next();
    } catch (error) { return next(error); }
  };
}

export function authorizeCurrentTask({ adminOnly = false } = {}) {
  return async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.taskId)) return res.status(404).json({ error: 'Tarea no encontrada' });
    try {
      const task = await Task.findById(req.params.taskId).select('proyecto desarrolladorAsignado').lean();
      if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
      req.params._taskProjectId = String(task.proyecto);
      return authorizeCurrentProject('_taskProjectId', { adminOnly })(req, res, error => {
        delete req.params._taskProjectId;
        if (error) return next(error);
        if (req.user.rol === 'user' && String(task.desarrolladorAsignado) !== String(req.user._id)) {
          return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        return next();
      });
    } catch (error) { return next(error); }
  };
}

export function authorizeCurrentUser(param = 'userId') {
  return async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) return res.status(404).json({ error: 'Usuario no encontrado' });
    try {
      const actor = await User.findById(req.user?._id).select('rol empresa').lean();
      const target = await User.findById(req.params[param]).select('rol empresa').lean();
      if (!actor || !target || !['admin', 'user'].includes(actor.rol)) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (actor.empresa) {
        const company = await Company.findById(actor.empresa).select('activa').lean();
        if (!company?.activa) return res.status(403).json({ error: 'La empresa no está habilitada' });
      }
      const self = String(actor._id) === String(target._id);
      const adminOfDeveloper = actor.rol === 'admin' && target.rol === 'user' && String(actor.empresa ?? '') === String(target.empresa ?? '');
      if (!self && !adminOfDeveloper) return res.status(404).json({ error: 'Usuario no encontrado' });
      req.user = { ...req.user, _id: actor._id, rol: actor.rol, empresa: actor.empresa ?? null };
      return next();
    } catch (error) { return next(error); }
  };
}

export async function authorizeAssignmentRecord(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.asignacionId)) return res.status(404).json({ error: 'Asignación no encontrada' });
    const assignment = await Asignacion.findById(req.params.asignacionId).select('proyecto tarea').lean();
    if (!assignment) return res.status(404).json({ error: 'Asignación no encontrada' });
    req.params._assignmentProjectId = String(assignment.proyecto);
    return authorizeCurrentProject('_assignmentProjectId', { adminOnly: true })(req, res, async error => {
      delete req.params._assignmentProjectId;
      if (error) return next(error);
      try {
        await validarAsignacionesEmpresa(assignment.proyecto, [{ tareaId: assignment.tarea, desarrolladorId: req.body?.nuevoDevId }]);
        return next();
      } catch { return res.status(400).json({ error: 'La tarea o el desarrollador no pertenecen al proyecto o a su empresa' }); }
    });
  } catch (error) { return next(error); }
}

export async function authorizeAssignmentPayload(req, res, next) {
  const projectId = req.body?.projectId ?? req.body?.basica?.projectId;
  if (!mongoose.isValidObjectId(projectId)) return res.status(400).json({ error: 'Falta un proyecto válido' });
  req.params._bodyProjectId = String(projectId);
  return authorizeCurrentProject('_bodyProjectId', { adminOnly: true })(req, res, async error => {
    delete req.params._bodyProjectId;
    if (error) return next(error);
    try {
      const body = req.body;
      const lists = [body.asignaciones, body['asignaciones-manuales'], ...['basica', 'costo', 'tiempo', 'tiempoIA', 'calidad'].map(key => body[key]?.asignaciones)].filter(Array.isArray);
      const items = lists.flat().filter(Boolean);
      const ids = items.map(item => item.tareaId).filter(Boolean);
      if (ids.some(id => !mongoose.isValidObjectId(id))) return res.status(400).json({ error: 'Tarea inválida' });
      const tasks = await Task.find({ _id: { $in: ids }, proyecto: projectId }).select('_id').lean();
      const allowed = new Set(tasks.map(task => String(task._id)));
      if (ids.some(id => !allowed.has(String(id)))) return res.status(404).json({ error: 'Tarea no encontrada' });
      const assigned = items.filter(item => item.tareaId && item.desarrolladorId);
      if (assigned.length) await validarAsignacionesEmpresa(projectId, assigned);
      return next();
    } catch (error) { return res.status(400).json({ error: error.message }); }
  });
}

// Los registros masivos pueden incluir referencias a varios proyectos.
export function authorizeCompanyRecords(getRecords, { requireTask = false } = {}) {
  return async (req, res, next) => {
    try {
      const records = getRecords(req);
      if (!Array.isArray(records) || !records.length) return res.status(400).json({ error: 'Se requieren registros' });
      const actor = await User.findById(req.user?._id).select('rol empresa').lean();
      if (!actor || actor.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
      if (actor.empresa) {
        const company = await Company.findById(actor.empresa).select('activa').lean();
        if (!company?.activa) return res.status(403).json({ error: 'La empresa no está habilitada' });
      }
      for (const record of records) {
        if (!record || !mongoose.isValidObjectId(record.proyecto) || !mongoose.isValidObjectId(record.desarrollador) || (requireTask && !mongoose.isValidObjectId(record.tarea))) {
          return res.status(400).json({ error: 'Referencia inválida' });
        }
        const projectFilter = { _id: record.proyecto, empresa: actor.empresa ?? null };
        if (!actor.empresa) projectFilter.administrador = actor._id;
        if (!(await Project.exists(projectFilter)) || !(await User.exists({ _id: record.desarrollador, rol: 'user', empresa: actor.empresa ?? null }))) {
          return res.status(404).json({ error: 'Proyecto o desarrollador no encontrado' });
        }
        if (requireTask && !(await Task.exists({ _id: record.tarea, proyecto: record.proyecto, desarrolladorAsignado: record.desarrollador }))) {
          return res.status(404).json({ error: 'Tarea no encontrada' });
        }
      }
      req.user = { ...req.user, _id: actor._id, rol: actor.rol, empresa: actor.empresa ?? null };
      return next();
    } catch (error) { return next(error); }
  };
}
