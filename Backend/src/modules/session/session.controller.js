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
// Controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;  // 🔥 extraer email y password
    const result = await sessionService.loginUser(email, password);

    if (!result) return res.status(400).json({ error: "Credenciales inválidas" });

    res.cookie("cookieToken", result.token, {
      httpOnly: true,
      secure: false, // true en producción con HTTPS
      asameSite: "lax"
    });

    return res.json({ message: "login success", token: result.token });

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

export const getProfile = async (req, res) => {
  try {
    const profile = await sessionService.getProfile(req.user._id); // ✅ ahora sí
    res.json({ status: "ok", payload: profile });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};


// Actualizar perfil de usuario
export const updateMe = async (req, res) => {
  try {
    const updated = await sessionService.updateMe(req.user._id, req.body);
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

export const getGoogleSession = async (req, res) => {
  try {
    // El middleware auth ya cargó req.user
    const userId = req.user._id;  

    // Buscar en la DB para traer los datos completos
    const user = await sessionService.getProfile(userId);

    return res.json({
      user,
      token: req.cookies.cookieToken // también podés mandar req.headers.authorization
    });
  } catch (error) {
    console.error("Error en getGoogleSession:", error);
    return res.status(500).json({ error: "Error obteniendo sesión Google" });
  }
};


export async function dashboardController(req, res) {
  try {
    const user = req.user; // el middleware auth ya lo puso
    if (!user) return res.status(401).json({ error: "No autorizado" });

    const payload = await sessionService.getDashboardData(user);

    res.json({ status: "ok", payload });
  } catch (err) {
    console.error("Error obteniendo dashboard:", err);
    res.status(500).json({ error: "Error obteniendo dashboard" });
  }
}