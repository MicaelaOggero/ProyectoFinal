import * as userService from "./user.service.js";

// Obtener todos los usuarios (solo admins)
export const getUsers = async (req, res) => {
  try {
    const usuarios = await userService.getUsers();
    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error en getUsers:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const usuario = await userService.getUserById(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    console.error("❌ Error en getUserById:", error);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

// Actualizar un usuario
export const updateUser = async (req, res) => {
  try {
    const usuario = await userService.updateUser(req.params.id, req.body);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Usuario actualizado", usuario });
  } catch (error) {
    console.error("❌ Error en updateUser:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
  try {
    const usuario = await userService.deleteUser(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado correctamente", usuario });
  } catch (error) {
    console.error("❌ Error en deleteUser:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
