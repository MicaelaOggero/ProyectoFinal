import * as sessionService from "./session.service.js";

// Registrar un nuevo usuario
export const registerUser = async (req, res) => {
  try {
    const nuevoUsuario = await sessionService.registerUser(req.body);
    res.status(201).json({ mensaje: "✅ Usuario registrado correctamente", usuario: nuevoUsuario });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Iniciar sesión de usuario
export const loginUser = async (req, res) => {
  try {
    const token = await sessionService.loginUser(req.body, req.session);
    res.cookie("cookieToken", token, {
      maxAge: 60 * 60 * 24 * 1000, // 1 día
      httpOnly: true,
      secure: false
    }).send({ status: "login success" });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Cerrar sesión de usuario
export const logoutUser = async (req, res) => {
  try {
    await sessionService.logoutUser(res);
    res.status(200).send({ status: "✅ Logout ok" });
  } catch (error) {
    res.status(500).json({ error: "Logout ERROR", message: error.message });
  }
};

// Restablecer contraseña
export const resetPassword = async (req, res) => {
  try {
    await sessionService.resetPassword(req.body);
    res.send("Reseteo de contraseña exitoso");
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Obtener perfil de usuario
export const getProfile = async (req, res) => {
  try {
    const profile = await sessionService.getProfile(req.user?._id);
    res.json({ status: "ok", payload: profile });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Actualizar perfil de usuario
export const updateMe = async (req, res) => {
  try {
    const updated = await sessionService.updateMe(req.session.userId, req.body);
    res.json({ message: "Perfil actualizado", usuario: updated });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Google OAuth
export const googleAuth = (req, res, next) => {
  sessionService.googleAuth()(req, res, next);
};

export const googleCallback = (req, res, next) => {
  sessionService.googleCallback(req, res, next);
};
