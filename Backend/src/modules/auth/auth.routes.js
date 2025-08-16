export const auth = (req, res, next) => {
  if (req.session?.rol === "user" || req.session?.rol === "admin") {
    return next();
  }
  return res.status(401).send('usuario no autorizado');
};

export const authAdmin = (req, res, next) => {
  if (req.session?.rol === "admin") {
    // Guardar el ID del usuario en la request para usarlo después
    req.userId = req.session.userId; // asegurate de que el id se guarde en la sesión al loguear
    return next();
  }
  return res.status(401).send('Usuario no autorizado');
};
