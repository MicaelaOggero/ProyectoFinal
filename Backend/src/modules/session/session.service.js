import * as sessionDao from "./session.dao.js";
import { findUsersByRole } from "../users/user.dao.js";
import { createHash, generateToken, isValidPassword } from "../../utils/utils.js";
import { findByAdmin } from "../projects/project.dao.js";
import passport from "passport";

// Registrar un nuevo usuario
export const registerUser = async (data) => {
  const userExists = await sessionDao.findByEmail(data.email);
  if (userExists) throw { status: 409, message: "Ya existe un usuario con ese Email" };

  data.password = createHash(data.password);
  return await sessionDao.createUser(data);
};

// Iniciar sesión de usuario
export const loginUser = async (email, password) => {
  const user = await sessionDao.findByEmail(email);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };
  if (!isValidPassword(user, password)) throw { status: 403, message: "Contraseña incorrecta" };

  const token = generateToken(user);

  return { user, token };
};

// Cerrar sesión de usuario
export const logoutUser = async (res) => {
  res.clearCookie("cookieToken", { httpOnly: true, secure: false, sameSite: "strict" });
};

// Restablecer contraseña
export const resetPassword = async ({ email, password }) => {
  const user = await sessionDao.findByEmail(email);
  if (!user) throw { status: 404, message: "Usuario no encontrado" };

  return await sessionDao.updatePassword(user._id, createHash(password));
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
  return await sessionDao.updateUser(userId, data);
};

// Obtener datos del dashboard según el rol
export async function getDashboardData(user) {
  try {
    const payload = { user };

    if (user.rol === "admin") {
      const projects = await findByAdmin(user._id);
      const users = await findUsersByRole("user");

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
