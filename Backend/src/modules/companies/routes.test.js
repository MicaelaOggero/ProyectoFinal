import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import Project from '../projects/project.model.js';
import Company from './company.model.js';
import Task from '../task/task.model.js';

process.env.JWT_SECRET = 'test-routes-secret';
process.env.OPENAI_API_KEY ||= 'test-key';
const { default: projectRouter } = await import('../projects/project.routes.js');
const { default: taskRouter } = await import('../task/task.routes.js');
const { default: companyRouter } = await import('./company.routes.js');

test('rutas HTTP rechazan proyectos y tareas de otra empresa', async t => {
  const saved = { user: User.findById, company: Company.exists, companyFind: Company.findById, project: Project.findOne, task: Task.findById };
  t.after(() => { User.findById = saved.user; Company.exists = saved.company; Company.findById = saved.companyFind; Project.findOne = saved.project; Task.findById = saved.task; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = () => query({ _id: '64b000000000000000000001', rol: 'admin', empresa: '64b00000000000000000000a' });
  Company.exists = async () => true;
  Company.findById = () => query({ activa: true });
  Project.findOne = () => query(null);
  Task.findById = () => query({ _id: '64b000000000000000000003', proyecto: '64b000000000000000000002' });
  const app = express();
  app.use(express.json());
  app.use('/project', projectRouter);
  app.use('/task', taskRouter);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { Authorization: `Bearer ${jwt.sign({ _id: '64b000000000000000000001', rol: 'admin' }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' };
  const project = await fetch(`${base}/project/64b000000000000000000002`, { headers });
  const task = await fetch(`${base}/task/64b000000000000000000003`, { method: 'PATCH', headers, body: '{}' });
  assert.equal(project.status, 404);
  assert.equal(task.status, 404);
});

test('solo el administrador general puede listar empresas', async t => {
  const saved = { user: User.findById, company: Company.find, companyFind: Company.findById };
  t.after(() => { User.findById = saved.user; Company.find = saved.company; Company.findById = saved.companyFind; });
  const query = value => ({ select: () => ({ lean: async () => value }) });
  User.findById = id => query(id === 'super' ? { _id: id, rol: 'superadmin' } : { _id: id, rol: 'admin', empresa: 'a' });
  Company.findById = () => query({ activa: true });
  Company.find = () => ({ select: () => ({ sort: () => ({ lean: async () => [{ nombre: 'Empresa A' }] }) }) });
  const app = express();
  app.use('/company', companyRouter);
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/company`;
  const token = id => ({ Authorization: `Bearer ${jwt.sign({ _id: id }, process.env.JWT_SECRET)}` });
  const admin = await fetch(base, { headers: token('admin') });
  const superadmin = await fetch(base, { headers: token('super') });
  assert.equal(admin.status, 403);
  assert.equal(superadmin.status, 200);
  assert.equal((await superadmin.json())[0].nombre, 'Empresa A');
});
