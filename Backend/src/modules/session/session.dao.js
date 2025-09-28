import User from "../users/user.model.js";
import {generarCalendarioAnual} from "../session/session.service.js"

// Buscar usuario por email
export const findByEmail = async (email) => User.findOne({ email });

// Buscar usuario por ID
export const findById = async (id, projection = "") => User.findById(id).select(projection).lean();

// Buscar usuario admin por ID
export async function getProjectsByAdmin(adminId) {
  return ProjectModel.find({ createdBy: adminId });
}

// Buscar usuario user por ID
export async function getUserById(userId) {
  return UserModel.findById(userId);
}

// Crear nuevo usuario

export async function createUser(data) {
  // agregar calendario automáticamente
  const calendario = await generarCalendarioAnual();

  const nuevoUsuario = new User({
    ...data,
    calendario
  });

  await nuevoUsuario.save();
  return nuevoUsuario;
};

// Actualizar contraseña de usuario
export const updatePassword = async (id, password) =>
  User.updateOne({ _id: id }, { $set: { password } });

// Actualizar datos de usuario
export const updateUser = async (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select("-password");

