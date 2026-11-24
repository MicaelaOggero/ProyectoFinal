import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../users/user.model.js';
import Company from './company.model.js';
import Invitation from './invitation.model.js';
import Project from '../projects/project.model.js';
import Task from '../task/task.model.js';
import { authenticateCompanyManager } from './company.auth.js';
import { authorizeProject, authorizeCurrentProject } from './tenant.auth.js';
import { aceptarInvitacion, crearInvitacion } from './company.service.js';
import { registerUser, updateMe } from '../session/session.service.js';
import { buscarUsuariosDisponiblesParaTareaService, updateUser } from '../users/user.service.js';
import { getProjects, updateProject } from '../projects/project.service.js';
import { editTask, obtenerTodasTareasService, getTasksByDeveloper } from '../task/task.service.js';
import { validarAsignacionesEmpresa } from './assignment.auth.js';
import { importDevelopers } from '../imports/import.service.js';
import { authAdmin } from '../../middlewares/auth.js';
import nodemailer from 'nodemailer';
import { sendEmail } from '../../utils/mailer.js';

test('la gestión de empresas consulta el rol actual y rechaza permisos del token obsoletos', async t => {
  const originalFind = User.findById;
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'company-test-secret';
  t.after(() => { User.findById = originalFind; process.env.JWT_SECRET = originalSecret; });
  User.findById = () => ({ select: () => ({ lean: async () => ({ _id: '1', rol: 'user' }) }) });
  const req = { headers: { authorization: `Bearer ${jwt.sign({ _id: '1', rol: 'superadmin' }, process.env.JWT_SECRET)}` }, cookies: {} };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let nextCalled = false;
  await authenticateCompanyManager(req, res, () => { nextCalled = true; });
  assert.equal(res.code, 403);
  assert.equal(nextCalled, false);
});

test('el registro público no permite elegir empresa ni rol privilegiado', async t => {
  const originalFind = User.findOne;
  const originalSave = User.prototype.save;
  t.after(() => { User.findOne = originalFind; User.prototype.save = originalSave; });
  User.findOne = async () => null;
  User.prototype.save = async function () { return this; };
  const user = await registerUser({ nombre: 'Prueba', email: 'prueba@example.com', password: '12345678', rol: 'superadmin', empresa: '64b000000000000000000001' });
  assert.equal(user.rol, 'user');
  assert.equal(user.empresa, null);
});

test('editar el propio perfil descarta rol y empresa', async t => {
  const originalUpdate = User.findByIdAndUpdate;
  t.after(() => { User.findByIdAndUpdate = originalUpdate; });
  let update;
  User.findByIdAndUpdate = (id, data) => { update = data; return { select: async () => ({ _id: id }) }; };
  await updateMe('1', { nombre: 'Nombre', rol: 'superadmin', empresa: 'otra' });
  assert.deepEqual(update, { nombre: 'Nombre' });
});

test('editar otra persona no permite cambiar su empresa o elevar su rol', async t => {
  const originalUpdate = User.findByIdAndUpdate;
  t.after(() => { User.findByIdAndUpdate = originalUpdate; });
  let update;
  User.findByIdAndUpdate = (id, data) => { update = data; return { select: async () => ({ _id: id }) }; };
  await updateUser('1', { nombre: 'Nombre', rol: 'superadmin', empresa: 'otra' });
  assert.deepEqual(update, { nombre: 'Nombre' });
});

test('una invitación inválida no crea cuentas', async t => {
  const originalClaim = Invitation.findOneAndUpdate;
  t.after(() => { Invitation.findOneAndUpdate = originalClaim; });
  let called = false;
  Invitation.findOneAndUpdate = async () => { called = true; return null; };
  await assert.rejects(aceptarInvitacion('invalid', { nombre: 'Persona', password: '12345678' }), /Invitación/);
  assert.equal(called, false);
});

test('si la cuenta ya existe se libera la invitación sin cambiarla de empresa', async t => {
  const originalClaim = Invitation.findOneAndUpdate;
  const originalUpdate = Invitation.updateOne;
  const originalCompany = Company.findById;
  const originalExists = User.exists;
  t.after(() => { Invitation.findOneAndUpdate = originalClaim; Invitation.updateOne = originalUpdate; Company.findById = originalCompany; User.exists = originalExists; });
  let released = false;
  Invitation.findOneAndUpdate = async () => ({ _id: 'inv', empresa: 'empresa', email: 'existing@example.com' });
  Invitation.updateOne = async () => { released = true; };
  Company.findById = () => ({ lean: async () => ({ activa: true }) });
  User.exists = async () => true;
  await assert.rejects(aceptarInvitacion('a'.repeat(64), { nombre: 'Persona', password: '12345678' }), /Ya existe/);
  assert.equal(released, true);
});

test('aceptar una invitación toma empresa y rol del servidor, no de la solicitud', async t => {
  const originalClaim = Invitation.findOneAndUpdate;
  const originalCompany = Company.findById;
  const originalExists = User.exists;
  const originalCreate = User.create;
  t.after(() => { Invitation.findOneAndUpdate = originalClaim; Company.findById = originalCompany; User.exists = originalExists; User.create = originalCreate; });
  let created;
  Invitation.findOneAndUpdate = async query => {
    assert.equal(query.aceptadaEn, null);
    assert.ok(query.venceEn.$gt instanceof Date);
    return { _id: 'inv', empresa: 'empresa-real', email: 'persona@example.com', rol: 'user' };
  };
  Company.findById = () => ({ lean: async () => ({ activa: true, nombre: 'Empresa' }) });
  User.exists = async () => false;
  User.create = async data => { created = data; return { _id: 'user1' }; };
  await aceptarInvitacion('a'.repeat(64), { nombre: 'Persona', password: 'password-segura', rol: 'superadmin', empresa: 'otra-empresa' });
  assert.equal(created.rol, 'user');
  assert.equal(created.empresa, 'empresa-real');
  assert.equal(await bcrypt.compare('password-segura', created.password), true);
});

test('un proyecto de otra empresa no es accesible aunque se conozca su identificador', async t => {
  const originalFind = Project.findOne;
  const originalExists = Task.exists;
  t.after(() => { Project.findOne = originalFind; Task.exists = originalExists; });
  let consulta;
  Project.findOne = filter => { consulta = filter; return { select: () => ({ lean: async () => null }) }; };
  Task.exists = async () => { throw new Error('No debe consultar tareas de otra empresa'); };
  const req = { params: { projectId: '64b000000000000000000001' }, user: { _id: 'u1', empresa: 'empresa-a', rol: 'admin' } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let allowed = false;
  await authorizeProject()(req, res, () => { allowed = true; });
  assert.equal(consulta.empresa, 'empresa-a');
  assert.equal(res.code, 404);
  assert.equal(allowed, false);
});

test('un desarrollador de la empresa debe tener una tarea asignada para acceder al proyecto', async t => {
  const originalFind = Project.findOne;
  const originalExists = Task.exists;
  t.after(() => { Project.findOne = originalFind; Task.exists = originalExists; });
  Project.findOne = () => ({ select: () => ({ lean: async () => ({ _id: 'project-a' }) }) });
  Task.exists = async filter => { assert.equal(filter.desarrolladorAsignado, 'u1'); return null; };
  const req = { params: { projectId: '64b000000000000000000001' }, user: { _id: 'u1', empresa: 'empresa-a', rol: 'user' } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let allowed = false;
  await authorizeProject()(req, res, () => { allowed = true; });
  assert.equal(res.code, 404);
  assert.equal(allowed, false);
});

test('la búsqueda manual rechaza tareas de otra empresa antes de consultar candidatos', async t => {
  const saved = { user: User.findById, task: Task.findById, project: Project.findById, find: User.find };
  t.after(() => { User.findById = saved.user; Task.findById = saved.task; Project.findById = saved.project; User.find = saved.find; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ rol: 'admin', empresa: 'empresa-a' });
  Task.findById = () => query({ proyecto: 'proyecto-b' });
  Project.findById = () => query({ empresa: 'empresa-b' });
  User.find = () => { throw new Error('No debe consultar candidatos'); };
  await assert.rejects(buscarUsuariosDisponiblesParaTareaService({ tareaId: 'tarea-b' }, 'admin-a'), error => error.status === 404);
});

test('la búsqueda manual usa las fechas reales de la tarea y filtra desarrolladores por empresa', async t => {
  const saved = { user: User.findById, task: Task.findById, project: Project.findById, find: User.find };
  t.after(() => { User.findById = saved.user; Task.findById = saved.task; Project.findById = saved.project; User.find = saved.find; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ rol: 'admin', empresa: 'empresa-a' });
  Task.findById = () => query({ proyecto: 'proyecto-a', fechaEstimadaInicio: new Date('2026-11-23'), fechaEstimadaFin: new Date('2026-11-23'), tiempoEstimadoHoras: 4, habilidadesRequeridas: ['Node.js'] });
  Project.findById = () => query({ empresa: 'empresa-a' });
  let filter;
  User.find = value => { filter = value; return query([{ _id: 'dev-a', nombre: 'Ana', habilidades: [{ nombre: 'nodejs' }], calendario: [{ fecha: new Date('2026-11-23'), horasDisponibles: 8 }] }]); };
  const result = await buscarUsuariosDisponiblesParaTareaService({ tareaId: 'tarea-a', incluirAlternativas: true }, 'admin-a');
  assert.deepEqual(filter, { rol: 'user', empresa: 'empresa-a' });
  assert.equal(result[0].horasEnPlazo, 8);
  assert.equal(result[0].cumpleHabilidades, true);
});

test('editar un proyecto no permite cambiar su empresa o administrador', async t => {
  const original = Project.findByIdAndUpdate;
  t.after(() => { Project.findByIdAndUpdate = original; });
  let update;
  Project.findByIdAndUpdate = async (id, data) => { update = data; return { _id: id }; };
  await updateProject('p', { nombre: 'Nombre nuevo', empresa: 'otra', administrador: 'otro' });
  assert.deepEqual(update, { nombre: 'Nombre nuevo' });
});

test('editar una tarea rechaza un desarrollador de otra empresa', async t => {
  const saved = { task: Task.findById, project: Project.findById, user: User.findById };
  t.after(() => { Task.findById = saved.task; Project.findById = saved.project; User.findById = saved.user; });
  Task.findById = async () => ({ proyecto: 'p', historial: [], save: async () => { throw new Error('No debe guardar'); } });
  Project.findById = async () => ({ empresa: 'empresa-a' });
  User.findById = async () => ({ rol: 'user', empresa: 'empresa-b' });
  await assert.rejects(editTask('t', { desarrolladorAsignado: 'dev-b' }, 'admin'), /no pertenece/);
});

test('editar una tarea no permite trasladarla a otro proyecto', async t => {
  const original = Task.findById;
  t.after(() => { Task.findById = original; });
  const task = { proyecto: 'proyecto-a', descripcion: 'Anterior', historial: [], save: async () => {} };
  Task.findById = async () => task;
  await editTask('t', { proyecto: 'proyecto-b', descripcion: 'Nueva' }, 'admin');
  assert.equal(task.proyecto, 'proyecto-a');
  assert.equal(task.descripcion, 'Nueva');
});

test('la confirmación rechaza desarrolladores de otra empresa antes de guardar', async t => {
  const saved = { project: Project.findById, task: Task.find, user: User.find };
  t.after(() => { Project.findById = saved.project; Task.find = saved.task; User.find = saved.user; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  Project.findById = () => query({ _id: 'proyecto-a', empresa: 'empresa-a' });
  Task.find = filter => { assert.equal(filter.proyecto, 'proyecto-a'); return query([{ _id: 'tarea-a' }]); };
  User.find = filter => { assert.equal(filter.empresa, 'empresa-a'); return query([]); };
  await assert.rejects(validarAsignacionesEmpresa('proyecto-a', [{ tareaId: 'tarea-a', desarrolladorId: 'dev-b' }]), /no pertenece/);
});

test('la confirmación rechaza tareas de otro proyecto', async t => {
  const saved = { project: Project.findById, task: Task.find, user: User.find };
  t.after(() => { Project.findById = saved.project; Task.find = saved.task; User.find = saved.user; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  Project.findById = () => query({ _id: 'proyecto-a', empresa: 'empresa-a' });
  Task.find = () => query([]);
  User.find = () => query([{ _id: 'dev-a' }]);
  await assert.rejects(validarAsignacionesEmpresa('proyecto-a', [{ tareaId: 'tarea-b', desarrolladorId: 'dev-a' }]), /no pertenece/);
});

test('un administrador anterior no puede acceder a proyectos sin empresa de otra persona', async t => {
  const saved = { user: User.findById, project: Project.findOne };
  t.after(() => { User.findById = saved.user; Project.findOne = saved.project; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ _id: 'admin-a', rol: 'admin', empresa: null });
  Project.findOne = filter => { assert.equal(filter.empresa, null); return query({ _id: 'p', administrador: 'admin-b' }); };
  const req = { params: { id: '64b000000000000000000001' }, user: { _id: 'admin-a' } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let nextCalled = false;
  await authorizeCurrentProject('id')(req, res, () => { nextCalled = true; });
  assert.equal(res.code, 404);
  assert.equal(nextCalled, false);
});

test('un administrador de empresa activa puede gestionar proyectos de su empresa', async t => {
  const saved = { user: User.findById, project: Project.findOne, company: Company.findById };
  t.after(() => { User.findById = saved.user; Project.findOne = saved.project; Company.findById = saved.company; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ _id: 'admin-a', rol: 'admin', empresa: 'empresa-a' });
  Company.findById = () => query({ activa: true });
  Project.findOne = filter => { assert.equal(filter.empresa, 'empresa-a'); return query({ _id: 'p' }); };
  const req = { params: { projectId: '64b000000000000000000001' }, user: { _id: 'admin-a' } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let nextCalled = false;
  await authorizeCurrentProject('projectId', { adminOnly: true })(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.empresa, 'empresa-a');
});

test('la lista de tareas de un administrador solo incluye sus proyectos antiguos', async t => {
  const saved = { user: User.findById, project: Project.find, task: Task.find };
  t.after(() => { User.findById = saved.user; Project.find = saved.project; Task.find = saved.task; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ _id: 'admin-a', rol: 'admin', empresa: null });
  Project.find = filter => { assert.deepEqual(filter, { empresa: null, administrador: 'admin-a' }); return query([{ _id: 'p-a' }]); };
  Task.find = async filter => { assert.deepEqual(filter, { proyecto: { $in: ['p-a'] } }); return []; };
  assert.deepEqual(await obtenerTodasTareasService('admin-a'), []);
});

test('un desarrollador no puede consultar las tareas de otro usuario', async t => {
  const original = User.findById;
  const originalCompany = Company.findById;
  t.after(() => { User.findById = original; Company.findById = originalCompany; });
  User.findById = () => ({ select: () => ({ lean: async () => ({ _id: 'dev-a', rol: 'user', empresa: 'a' }) }) });
  Company.findById = () => ({ select: () => ({ lean: async () => ({ activa: true }) }) });
  await assert.rejects(getTasksByDeveloper('dev-b', 'dev-a'), /No autorizado/);
});

test('importar desarrolladores no modifica cuentas de otra empresa', async t => {
  const saved = { byId: User.findById, byEmail: User.findOne, update: User.findByIdAndUpdate, company: Company.exists };
  t.after(() => { User.findById = saved.byId; User.findOne = saved.byEmail; User.findByIdAndUpdate = saved.update; Company.exists = saved.company; });
  User.findById = () => ({ select: () => ({ lean: async () => ({ rol: 'admin', empresa: 'empresa-a' }) }) });
  Company.exists = async () => true;
  User.findOne = async () => ({ _id: 'dev-b', rol: 'user', empresa: 'empresa-b' });
  User.findByIdAndUpdate = () => { throw new Error('No debe actualizar otra empresa'); };
  await assert.rejects(importDevelopers([{ nombre: 'Persona', email: 'persona@example.com' }], 'admin-a'), /otra cuenta o empresa/);
});

test('los desarrolladores solo reciben proyectos de su empresa con tareas asignadas', async t => {
  const saved = { user: User.findById, company: Company.findById, distinct: Task.distinct, projects: Project.find };
  t.after(() => { User.findById = saved.user; Company.findById = saved.company; Task.distinct = saved.distinct; Project.find = saved.projects; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ _id: 'dev-a', rol: 'user', empresa: 'empresa-a' });
  Company.findById = () => query({ activa: true });
  Task.distinct = async (field, filter) => { assert.equal(field, 'proyecto'); assert.equal(filter.desarrolladorAsignado, 'dev-a'); return ['p-a']; };
  Project.find = async filter => { assert.deepEqual(filter, { _id: { $in: ['p-a'] }, empresa: 'empresa-a' }); return [{ _id: 'p-a' }]; };
  assert.deepEqual(await getProjects('dev-a'), [{ _id: 'p-a' }]);
});

test('el permiso de administrador se verifica en la base y no en un token antiguo', async t => {
  const savedUser = User.findById;
  const savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';
  t.after(() => { User.findById = savedUser; process.env.JWT_SECRET = savedSecret; });
  User.findById = () => ({ select: () => ({ lean: async () => ({ _id: 'u', rol: 'user', empresa: null }) }) });
  const req = { cookies: {}, headers: { authorization: `Bearer ${jwt.sign({ _id: 'u', rol: 'admin' }, process.env.JWT_SECRET)}` } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let called = false;
  await authAdmin(req, res, () => { called = true; });
  assert.equal(res.code, 403);
  assert.equal(called, false);
});

test('un enlace de restablecimiento no sirve como sesión', async t => {
  const savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';
  t.after(() => { process.env.JWT_SECRET = savedSecret; });
  const req = { cookies: {}, headers: { authorization: `Bearer ${jwt.sign({ _id: 'u', purpose: 'password_reset' }, process.env.JWT_SECRET)}` } };
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  await authAdmin(req, res, () => assert.fail('No debe autorizar el token'));
  assert.equal(res.code, 403);
});

test('sin correo configurado se genera un enlace privado sin guardar el token en claro', async t => {
  const saved = { company: Company.findById, exists: User.exists, create: Invitation.create, key: process.env.RESEND_API_KEY, from: process.env.RESEND_FROM_EMAIL, user: process.env.EMAIL_USER, password: process.env.EMAIL_PASSWORD, url: process.env.FRONTEND_URL, reset: process.env.FRONTEND_RESET_URL, env: process.env.NODE_ENV };
  t.after(() => {
    Company.findById = saved.company; User.exists = saved.exists; Invitation.create = saved.create;
    for (const [key, value] of Object.entries({ RESEND_API_KEY: saved.key, RESEND_FROM_EMAIL: saved.from, EMAIL_USER: saved.user, EMAIL_PASSWORD: saved.password, FRONTEND_URL: saved.url, FRONTEND_RESET_URL: saved.reset, NODE_ENV: saved.env })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  delete process.env.RESEND_API_KEY; delete process.env.RESEND_FROM_EMAIL; delete process.env.EMAIL_USER; delete process.env.EMAIL_PASSWORD; delete process.env.FRONTEND_RESET_URL;
  process.env.FRONTEND_URL = 'http://localhost:8081';
  Company.findById = () => ({ lean: async () => ({ _id: 'company-a', activa: true, nombre: 'Empresa A' }) });
  User.exists = async () => false;
  let created;
  Invitation.create = async data => { created = data; return { ...data, _id: 'inv' }; };
  const result = await crearInvitacion({ empresaId: 'company-a', email: 'user@example.com', rol: 'user', actorId: 'admin' });
  const token = new URL(result.enlace).searchParams.get('token');
  assert.equal(result.metodo, 'enlace');
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(created.tokenHash, token);
  assert.equal(created.empresa, 'company-a');
});

test('el correo usa la configuración Gmail de Mica sin enviar un mensaje real', async t => {
  const saved = { transport: nodemailer.createTransport, user: process.env.EMAIL_USER, password: process.env.EMAIL_PASSWORD };
  t.after(() => {
    nodemailer.createTransport = saved.transport;
    if (saved.user === undefined) delete process.env.EMAIL_USER; else process.env.EMAIL_USER = saved.user;
    if (saved.password === undefined) delete process.env.EMAIL_PASSWORD; else process.env.EMAIL_PASSWORD = saved.password;
  });
  process.env.EMAIL_USER = 'remitente@example.test';
  process.env.EMAIL_PASSWORD = 'clave-de-prueba';
  let config, message;
  nodemailer.createTransport = value => { config = value; return { sendMail: async data => { message = data; return { accepted: [data.to] }; } }; };
  await sendEmail({ to: 'destino@example.test', subject: 'Invitación', text: 'Prueba' });
  assert.equal(config.host, 'smtp.gmail.com');
  assert.equal(config.auth.user, 'remitente@example.test');
  assert.equal(config.auth.pass, 'clave-de-prueba');
  assert.equal(message.from, 'remitente@example.test');
  assert.equal(message.to, 'destino@example.test');
});
