import { Router } from "express"
import { auth, authAdmin } from "../auth/auth.routes.js"
import Project from "../projects/project.model.js"

const router = Router()



// Obtener proyectos (solo admins, solo los que crearon)
router.get('/', authAdmin, async (req, res) => {
  try {
    const projects = await Project.find({ administrador: req.userId }); // filtra por admin creador
    res.json(projects);
  } catch (error) {
    console.error('❌ Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});


// Obtener un proyecto específico por ID con equipo y tareas
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    
    const proyecto = await Project.findById(id)
      .populate('equipo.usuario', 'nombre apellido email rol')
    
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }

    res.json(proyecto)
  } catch (error) {
    console.error('❌ Error al obtener proyecto:', error)
    res.status(500).json({ error: 'Error al obtener proyecto' })
  }
})

// Crear un nuevo proyecto (solo admins)
router.post('/', authAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, fechaInicio, fechaFin, nivelDificultad, prioridad, estado, equipo } = req.body;

    // El middleware authAdmin debe poner el id del usuario en req.userId
    const administradorId = req.userId;

    const nuevoProyecto = await Project.create({
      nombre,
      descripcion,
      fechaInicio,
      fechaFin,
      nivelDificultad,
      prioridad,
      estado,
      administrador: administradorId, // asigna el admin automáticamente
    });

    res.status(201).json({ message: 'Proyecto creado con éxito', proyecto: nuevoProyecto });
  } catch (error) {
    console.error('❌ Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});


// Actualizar un proyecto por ID (solo admins)
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const datosActualizados = req.body

    const proyectoActualizado = await Project.findByIdAndUpdate(id, datosActualizados, { new: true })

    if (!proyectoActualizado) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }

    res.json({ message: 'Proyecto actualizado', proyecto: proyectoActualizado })
  } catch (error) {
    console.error('❌ Error al actualizar proyecto:', error)
    res.status(500).json({ error: 'Error al actualizar proyecto' })
  }
})

// Eliminar un proyecto por ID (solo admins)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const proyectoEliminado = await Project.findByIdAndDelete(id)

    if (!proyectoEliminado) {
      return res.status(404).json({ error: 'Proyecto no encontrado' })
    }

    res.json({ message: 'Proyecto eliminado correctamente' })
  } catch (error) {
    console.error('❌ Error al eliminar proyecto:', error)
    res.status(500).json({ error: 'Error al eliminar proyecto' })
  }
})


export default router
