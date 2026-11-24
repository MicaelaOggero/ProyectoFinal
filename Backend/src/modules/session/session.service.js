import * as sessionDao from "./session.dao.js";
import { findUsersByRole } from "../users/user.dao.js";
import { createHash, generateToken, isValidPassword } from "../../utils/utils.js";
import { findByAdmin } from "../projects/project.dao.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import { sendEmail, isMailConfigured } from '../../utils/mailer.js';

// Registrar un nuevo usuario
export const registerUser = async (data, { empresa = null } = {}) => {
  const userExists = await sessionDao.findByEmail(data.email);
  if (userExists) throw { status: 409, message: "Ya existe un usuario con ese Email" };

  const { nombre, apellido, dni, email, password, habilidades, aniosExperiencia, costoPorHora } = data;
  return await sessionDao.createUser({
    nombre, apellido, dni, email, password: createHash(password), habilidades,
    aniosExperiencia, costoPorHora, rol: 'user', empresa
  });
};


// Iniciar sesión de usuario
export const loginUser = async (email, password) => {
  const user = await sessionDao.findByEmail(email);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  if (!user.password) {
    throw { status: 400, message: "Este usuario no tiene contraseña (probablemente login con Google)" };
  }

  const validPassword = await isValidPassword(user, password);
  if (!validPassword) throw { status: 403, message: "Contraseña incorrecta" };

  const token = generateToken(user);
  return { user, token };
};

// Cerrar sesión de usuario
export const logoutUser = async (res) => {
  // Limpia la cookie
  res.clearCookie("cookieToken", {
    httpOnly: true,
    secure: false, // true en producción con HTTPS
    sameSite: "lax"
  });
  return true;
};

// Restablecer contraseña
export const resetPassword = async ({ email, password }) => {
  const user = await sessionDao.findByEmail(email);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  return await sessionDao.updatePassword(user._id, createHash(password));
};

const buildPasswordResetToken = (user, expiresIn = "1h") => {
  return jwt.sign(
    { _id: user._id, email: user.email, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

const sendPasswordResetEmail = async ({ email, token }) => {
  const resetUrlBase = process.env.FRONTEND_RESET_URL;

  if (!isMailConfigured() || !resetUrlBase) {
    throw { status: 500, message: "Servicio de email no configurado" };
  }

  const resetLink = `${resetUrlBase}?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Restablecer contraseña",
    text: `Usá este enlace para restablecer tu contraseña: ${resetLink}`,
  });


};

export const requestPasswordReset = async (email) => {
  if (!email) throw { status: 400, message: "Email requerido" };

  const user = await sessionDao.findByEmail(email);
  if (!user) return { message: "Si el email existe, se enviará un enlace" };

  if (!user.password) {
    throw { status: 400, message: "Este usuario no tiene contraseña" };
  }

  const token = buildPasswordResetToken(user);
  await sendPasswordResetEmail({ email: user.email, token });

  return { message: "Email de restablecimiento enviado" };
};

export const confirmPasswordReset = async ({ token, password }) => {
  if (!token || !password) {
    throw { status: 400, message: "Token y password son requeridos" };
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw { status: 403, message: "Token inválido o expirado" };
  }

  if (payload.purpose !== "password_reset") {
    throw { status: 403, message: "Token inválido" };
  }

  const user = await sessionDao.findByEmail(payload.email);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  await sessionDao.updatePassword(user._id, createHash(password));
  return { message: "Contraseña actualizada" };
};

// Obtener perfil de usuario
export const getProfile = async (userId) => {
  if (!userId) throw { status: 401, message: "No autorizado" };

  const user = await sessionDao.findById(userId, "-password -fechaCreacion");
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  return user;
};

// Actualizar perfil de usuario
export const updateMe = async (userId, data) => {
  if (!userId) throw { status: 401, message: "No autorizado" };
  const allowed = ['nombre', 'apellido', 'dni', 'habilidades', 'aniosExperiencia', 'costoPorHora', 'preferencias'];
  const safeData = Object.fromEntries(allowed.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]]));
  return await sessionDao.updateUser(userId, safeData);
};

// Obtener datos del dashboard según el rol
export async function getDashboardData(user) {
  try {
    const payload = { user };

    if (user.rol === "admin") {
      const projects = await findByAdmin(user._id);
      const admin = await sessionDao.findById(user._id);
      if (!admin || admin.rol !== 'admin') throw new Error('No autorizado');
      const users = await findUsersByRole("user", admin.empresa ?? null);

      payload.projects = projects;
      payload.users = users;
    } else if (user.rol === "user") {
      payload.message = "Usar rutas /profile y /me para datos específicos";
    }

    return payload;
  } catch (err) {
    console.error("Error en getDashboardData:", err);
    throw err; // lo propaga al controller
  }
}


// Google OAuth - Iniciar login con Google
export const googleAuth = () => passport.authenticate("google", { scope: ["profile", "email"] });

export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { failureRedirect: "/login" }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login");

    // generamos token
    const accessToken = generateToken(user);
    res.cookie("cookieToken", accessToken, {
      httpOnly: true,
      secure: false, // true en producción con HTTPS
      sameSite: "lax"
    });

    // redirige al frontend a la página intermedia
    res.redirect("http://localhost:8081/google-callback");
  })(req, res, next);
};

