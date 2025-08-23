import { Router } from "express"
import User from "../users/user.model.js"
import { authAdmin, authToken } from "../../middlewares/auth.js"
import Project from '../projects/project.model.js'; // asegurate de importar el modelo Project

const router = Router()

// Obtener todos los usuarios con rol 'user' (requiere estar autenticado)
router.get('/', authAdmin, authToken, async (req, res) => {
  try {
    const usuarios = await User.find({ rol: 'user' }).select('-password'); // filtra por rol y excluye password
    res.json(usuarios);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener un usuario específico por ID (requiere estar autenticado)
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const usuario = await User.findById(id).select('-password') // excluye el password por seguridad

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(usuario)
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error)
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

// Actualizar datos de un usuario (solo admin)
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, apellido, habilidades, disponibilidadSemanal, aniosExperiencia, costoPorHora, historialDesempeño } = req.body

    const camposAActualizar = {
      nombre,
      apellido,
      habilidades,
      disponibilidadSemanal,
      aniosExperiencia,
      costoPorHora,
      historialDesempeño
    }

    const usuarioActualizado = await User.findByIdAndUpdate(
      id,
      camposAActualizar,
      { new: true, runValidators: true }
    )

    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ message: 'Usuario actualizado', usuario: usuarioActualizado })
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})


// Eliminar un usuario por ID (solo admin)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Buscar al usuario a eliminar
    const usuario = await User.findById(id)
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Si el usuario es admin, verificar si tiene proyectos asociados
    if (usuario.rol === 'admin') {
      const proyectos = await Project.find({ administrador: usuario._id })
      if (proyectos.length > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar un admin que tenga proyectos asociados'
        })
      }
    }

    // Eliminar usuario
    const usuarioEliminado = await User.findByIdAndDelete(id)
    res.json({ message: 'Usuario eliminado correctamente', usuario: usuarioEliminado })
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})


export default router
