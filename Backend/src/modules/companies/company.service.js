import { createHash, randomBytes } from 'node:crypto';
import { isMailConfigured, sendEmail } from '../../utils/mailer.js';
import Company from './company.model.js';
import Invitation from './invitation.model.js';
import User from '../users/user.model.js';
import { createHash as hashPassword } from '../../utils/utils.js';
import { generarCalendarioAnual } from '../users/user.service.js';

const hashToken = token => createHash('sha256').update(token).digest('hex');
const errorWithStatus = (message, status = 400) => Object.assign(new Error(message), { status });

export async function crearEmpresa(nombre, actorId) {
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 120) {
    throw errorWithStatus('Ingresá un nombre de empresa válido');
  }
  return Company.create({ nombre: nombre.trim(), creadaPor: actorId });
}

export async function crearInvitacion({ empresaId, email, rol, actorId }) {
  const address = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    throw errorWithStatus('Ingresá un correo válido');
  }
  if (!['admin', 'user'].includes(rol)) throw errorWithStatus('Rol de invitación inválido');
  const company = await Company.findById(empresaId).lean();
  if (!company?.activa) throw errorWithStatus('La empresa no existe o no está habilitada', 404);
  if (await User.exists({ email: address })) {
    throw errorWithStatus('Ya existe una cuenta con ese correo. Cada cuenta pertenece a una sola empresa.', 409);
  }
  let frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl && process.env.FRONTEND_RESET_URL) {
    try { frontendUrl = new URL(process.env.FRONTEND_RESET_URL).origin; } catch { /* se valida abajo */ }
  }
  if (!frontendUrl && process.env.NODE_ENV !== 'production') frontendUrl = 'http://localhost:8081';
  let url;
  try {
    url = new URL('/aceptar-invitacion', frontendUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    throw errorWithStatus('La dirección del frontend no está configurada correctamente', 503);
  }
  const token = randomBytes(32).toString('hex');
  url.searchParams.set('token', token);
  const invitacion = await Invitation.create({
    empresa: company._id, email: address, rol, tokenHash: hashToken(token),
    invitadoPor: actorId, venceEn: new Date(Date.now() + 48 * 60 * 60 * 1000)
  });
  if (!isMailConfigured()) {
    return { email: address, rol, venceEn: invitacion.venceEn, metodo: 'enlace', enlace: url.toString() };
  }
  try {
    await sendEmail({
      to: address, subject: 'Invitación a SmartAssistant',
      text: `Te invitaron a unirte a ${company.nombre} en SmartAssistant. Abrí este enlace para aceptar la invitación: ${url.toString()}\n\nEl enlace vence en 48 horas.`
    });
  } catch (error) {
    await Invitation.deleteOne({ _id: invitacion._id });
    throw errorWithStatus('No se pudo enviar el correo de invitación. Intentá nuevamente.', 502);
  }
  return { email: address, rol, venceEn: invitacion.venceEn, metodo: 'correo' };
}

export async function obtenerInvitacion(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) throw errorWithStatus('Invitación inválida o vencida', 404);
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token), aceptadaEn: null, venceEn: { $gt: new Date() } }).populate('empresa', 'nombre activa').lean();
  if (!invitation?.empresa?.activa) throw errorWithStatus('Invitación inválida o vencida', 404);
  return { empresa: invitation.empresa.nombre, email: invitation.email, rol: invitation.rol, venceEn: invitation.venceEn };
}

export async function aceptarInvitacion(token, data) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) throw errorWithStatus('Invitación inválida o vencida', 404);
  const nombre = typeof data?.nombre === 'string' ? data.nombre.trim() : '';
  if (!nombre || typeof data?.password !== 'string' || data.password.length < 8) {
    throw errorWithStatus('Ingresá tu nombre y una contraseña de al menos 8 caracteres');
  }
  const claimedAt = new Date();
  const invitation = await Invitation.findOneAndUpdate(
    { tokenHash: hashToken(token), aceptadaEn: null, venceEn: { $gt: claimedAt } },
    { $set: { aceptadaEn: claimedAt } }, { new: true }
  );
  if (!invitation) throw errorWithStatus('Invitación inválida, vencida o ya utilizada', 404);
  try {
    const company = await Company.findById(invitation.empresa).lean();
    if (!company?.activa) throw errorWithStatus('La empresa no está habilitada', 403);
    if (await User.exists({ email: invitation.email })) throw errorWithStatus('Ya existe una cuenta con ese correo', 409);
    const user = await User.create({
      nombre, apellido: typeof data.apellido === 'string' ? data.apellido.trim() : '',
      email: invitation.email, rol: invitation.rol, empresa: invitation.empresa,
      password: hashPassword(data.password), calendario: await generarCalendarioAnual()
    });
    return { id: user._id, empresa: company.nombre };
  } catch (error) {
    await Invitation.updateOne({ _id: invitation._id, aceptadaEn: claimedAt }, { $set: { aceptadaEn: null } });
    if (error?.code === 11000) throw errorWithStatus('Ya existe una cuenta con ese correo', 409);
    throw error;
  }
}
