import * as userService from "./user.service.js";
import User from "../users/user.model.js";

// Obtener todos los usuarios con rol 'user'
export const getUsers = async (req, res) => {
  try {
    const usuarios = await userService.getUsers(req.user.rol);
    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error en controller.getUsers:", error);
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
    console.error("❌ Error en controller.getUserById:", error);
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
    console.error("❌ Error en controller.updateUser:", error);
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
    console.error("❌ Error en controller.deleteUser:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

// Mostrar calendario de un desarrollador
export async function obtenerCalendario(req, res) {
  try {
    const { userId } = req.params;
    const { month } = req.query; // ej: "2025-09"

    const calendario = await userService.obtenerCalendarioService(userId, month);

    res.json({ calendario });
  } catch (error) {
    if (error.message === "Usuario no encontrado") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// Función auxiliar para generar calendario de un año completo
export async function generarCalendarioAnual() {
  const calendario = [];
  const inicio = new Date();
  inicio.setHours(0,0,0,0);
  const fin = new Date(inicio);
  fin.setFullYear(fin.getFullYear() + 1); // un año de calendario

  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const dia = d.getDay();
    if (dia >= 1 && dia <= 5) { // lunes a viernes
      calendario.push({ fecha: new Date(d), horasDisponibles: 8 });
    }
  }

  return calendario;
}

// Editar calendario de un desarrollador
export const editarCalendario = async (req, res) => {
  try {
    const { userId } = req.params;
    const cambios = req.body; // 👈 ya es un array

    if (!Array.isArray(cambios)) {
      return res.status(400).json({ error: "El body debe ser un array de cambios" });
    }

    const dev = await userService.editarCalendarioService(userId, cambios);
    res.json({ message: "Calendario actualizado", calendario: dev.calendario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};