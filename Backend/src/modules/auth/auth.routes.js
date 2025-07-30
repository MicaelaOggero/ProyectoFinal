export const auth = (req, res, next) => {
  if (req.session?.rol === "user" || req.session?.rol === "admin") {
    return next();
  }
  return res.status(401).send('usuario no autorizado');
};

export const authAdmin = (req, res, next) => {
  if (req.session?.rol === "admin") {
    return next();
  }
  return res.status(401).send('usuario no autorizado');
};
