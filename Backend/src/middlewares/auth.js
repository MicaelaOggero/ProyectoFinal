import jwt from "jsonwebtoken";

// Middleware para validar rol user o admin
export const auth = (req, res, next) => {
  if (req.session?.rol === "user" || req.session?.rol === "admin") {
    return next();
  }
  return res.status(401).send("usuario no autorizado");
};

// Middleware para validar solo admin
export const authAdmin = (req, res, next) => {
  if (req.session?.rol === "admin") {
    // Guardar el ID del usuario en la request para usarlo después
    req.userId = req.session.userId; // asegurate de que el id se guarde en la sesión al loguear
    return next();
  }
  return res.status(401).send("Usuario no autorizado");
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

    // Guardamos el payload del token en req.user
    req.user = credentials.user;
    next();
  });
};

