import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const token = req.cookies.cookieToken || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.rol === "user" || payload.rol === "admin") {
      req.user = payload;
      return next();
    }
    return res.status(403).json({ error: "Acceso denegado" });
  } catch {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

export const authAdmin = (req, res, next) => {
  const token = req.cookies.cookieToken || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.rol === "admin") {
      req.user = payload;
      return next();
    }
    return res.status(403).json({ error: "Acceso denegado" });
  } catch {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

export const authToken = (req, res, next) => {
  const token = req.cookies.cookieToken;
  if (!token) return res.status(401).send({ error: "No autenticado" });

  jwt.verify(token, process.env.JWT_SECRET, (error, credentials) => {
    if (error) return res.status(403).send({ error: "No autorizado" });
    req.user = credentials;
    next();
  });
};
