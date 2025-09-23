import User from "./user.model.js";

// Buscar usuarios por rol
export const findUsersByRole = async (rol) => {
  return await User.find({ rol }).select("-password");
};

// Buscar un usuario por ID
export const findUserById = async (id) => {
  return await User.findById(id).select("-password");
};

// Actualizar usuario
export const updateUser = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// Eliminar usuario
export const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id);
};

// Guardar cambios en el dev
export const saveUser = async (user) => {
  return user.save();
};

export const findUser = (id) => User.findById(id);