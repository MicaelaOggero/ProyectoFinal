import { Router } from 'express';
import Company from './company.model.js';
import { authenticateCompanyManager, requireSuperadmin } from './company.auth.js';
import { aceptarInvitacion, crearEmpresa, crearInvitacion, obtenerInvitacion } from './company.service.js';

const router = Router();
const handle = fn => async (req, res, next) => {
  try { await fn(req, res); }
  catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    if (error.name === 'CastError') return res.status(400).json({ error: 'Identificador inválido' });
    return next(error);
  }
};

router.get('/invitaciones/:token', handle(async (req, res) => {
  res.json(await obtenerInvitacion(req.params.token));
}));
router.post('/invitaciones/aceptar', handle(async (req, res) => {
  res.status(201).json(await aceptarInvitacion(req.body?.token, req.body));
}));
router.get('/', authenticateCompanyManager, requireSuperadmin, handle(async (req, res) => {
  res.json(await Company.find().select('nombre activa createdAt').sort({ nombre: 1 }).lean());
}));
router.post('/', authenticateCompanyManager, requireSuperadmin, handle(async (req, res) => {
  const company = await crearEmpresa(req.body?.nombre, req.companyManager._id);
  res.status(201).json({ id: company._id, nombre: company.nombre, activa: company.activa });
}));
router.post('/:empresaId/invitaciones-admin', authenticateCompanyManager, requireSuperadmin, handle(async (req, res) => {
  res.status(201).json(await crearInvitacion({ empresaId: req.params.empresaId, email: req.body?.email, rol: 'admin', actorId: req.companyManager._id }));
}));
router.post('/mi-empresa/invitaciones', authenticateCompanyManager, handle(async (req, res) => {
  if (req.companyManager.rol !== 'admin' || !req.companyManager.empresa) {
    return res.status(403).json({ error: 'Solo un administrador de empresa puede invitar desarrolladores' });
  }
  return res.status(201).json(await crearInvitacion({ empresaId: req.companyManager.empresa, email: req.body?.email, rol: 'user', actorId: req.companyManager._id }));
}));

export default router;
