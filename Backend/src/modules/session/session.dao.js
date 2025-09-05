import User from "../users/user.model.js";

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
export const createUser = async (data) => {
  const newUser = new User(data);
  return await newUser.save();
}

// Actualizar contraseña de usuario
export const updatePassword = async (id, password) =>
  User.updateOne({ _id: id }, { $set: { password } });

// Actualizar datos de usuario
export const updateUser = async (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select("-password");

