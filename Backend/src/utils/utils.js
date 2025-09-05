import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

//encriptar contraseña
export const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10))

//desencriptar contraseña
export const isValidPassword = (user, password) => bcrypt.compare(password, user.password)

//jwt
export const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

