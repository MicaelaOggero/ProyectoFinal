import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import Company from './company.model.js';

// Los permisos de gestión se consultan en la base en cada solicitud.
export async function authenticateCompanyManager(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.cookieToken;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o vencida' });
  }
  if (!payload?._id || payload.purpose) return res.status(401).json({ error: 'Sesión inválida o vencida' });
  try {
    const user = await User.findById(payload._id).select('rol empresa').lean();
    if (!user || !['superadmin', 'admin'].includes(user.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para gestionar empresas' });
    }
    if (user.rol === 'admin') {
      const company = user.empresa && await Company.findById(user.empresa).select('activa').lean();
      if (!company?.activa) return res.status(403).json({ error: 'Tu empresa no está habilitada' });
    }
    req.companyManager = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireSuperadmin(req, res, next) {
  if (req.companyManager?.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Solo el administrador general puede realizar esta acción' });
  }
  return next();
}
