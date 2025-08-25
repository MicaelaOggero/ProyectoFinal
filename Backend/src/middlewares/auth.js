import jwt from "jsonwebtoken";

// Middleware para validar rol user o admin
export const auth = (req, res, next) => {
  // Leer token de la cookie o del header
  const token = req.cookies.cookieToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    // Verificar y decodificar token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Validar rol
    if (payload.rol === "user" || payload.rol === "admin") {
      req.user = payload; // guardamos el payload (id, email, rol)
      return next();
    }

    return res.status(403).json({ error: "Acceso denegado" });
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};


// Middleware para validar solo admin
export const authAdmin = (req, res, next) => {
  // Leer token de la cookie o del header
  const token = req.cookies.cookieToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    // Verificar y decodificar token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Validar rol
    if (payload.rol === "admin") {
      req.user = payload; // guardamos el payload (id, email, rol)
      return next();
    }

    return res.status(403).json({ error: "Acceso denegado" });
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};


export const authToken = (req, res, next) => {
  const token = req.cookies.cookieToken;

  if (!token) {
    return res.status(401).send({ error: "No autenticado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, credentials) => {
    if (error) {
      return res.status(403).send({ error: "No autorizado" });
    }

    // Guardamos el payload entero (que tiene _id, email, rol)
    req.user = credentials;
    next();
  });
};


