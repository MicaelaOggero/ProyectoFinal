import jwt from 'jsonwebtoken';
import User from '../modules/users/user.model.js';
import Company from '../modules/companies/company.model.js';

function authenticate(roles) {
  return async (req, res, next) => {
    const token = req.cookies?.cookieToken || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch { return res.status(403).json({ error: 'Token inválido o expirado' }); }
    if (!payload?._id || payload.purpose) return res.status(403).json({ error: 'Token inválido' });
    try {
      const user = await User.findById(payload._id).select('rol empresa email').lean();
      if (!user || !roles.includes(user.rol)) return res.status(403).json({ error: 'Acceso denegado' });
      if (user.empresa && !(await Company.exists({ _id: user.empresa, activa: true }))) {
        return res.status(403).json({ error: 'La empresa no está habilitada' });
      }
      req.user = { ...payload, _id: user._id, rol: user.rol, empresa: user.empresa ?? null, email: user.email };
      return next();
    } catch (error) { return next(error); }
  };
}

export const auth = authenticate(['user', 'admin', 'superadmin']);
export const authAdmin = authenticate(['admin']);
export const authToken = auth;
