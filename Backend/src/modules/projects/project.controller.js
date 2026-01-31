import * as projectService from "./project.service.js";

// Obtener todos los proyectos de un admin
export const getProjects = async (req, res) => {
  try {
    // Si el usuario NO es admin, devolvemos lista vacía
    if (req.user.rol !== "admin") {
      return res.json([]); 
    }

    // Si es admin, traer sus proyectos
    const projects = await projectService.getProjects(req.user._id);
    res.json(projects);
  } catch (error) {
    console.error("❌ Error en controller.getProjects:", error);
    res.status(500).json({ error: "Error al obtener proyectos" });
  }
};



// Obtener un proyecto por ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json(project);
  } catch (error) {
    console.error("❌ Error en controller.getProjectById:", error);
    res.status(500).json({ error: "Error al obtener proyecto" });
  }
};

// Crear un nuevo proyecto
export const createProject = async (req, res) => {
  try {
    const administradorId = req.user._id;  // ✅ usar el id del usuario logueado
    const nuevoProyecto = await projectService.createProject(req.body, administradorId);

    res.status(201).json({ message: "Proyecto creado con éxito", proyecto: nuevoProyecto });
  } catch (error) {
    console.error("❌ Error en controller.createProject:", error);
    res.status(500).json({ error: "Error al crear proyecto" });
  }
};


// Actualizar un proyecto
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProject = await projectService.updateProject(id, req.body);

    if (!updatedProject) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json({ message: "Proyecto actualizado", proyecto: updatedProject });
  } catch (error) {
    console.error("❌ Error en controller.updateProject:", error);
    res.status(500).json({ error: "Error al actualizar proyecto" });
  }
};

// Eliminar un proyecto
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await projectService.deleteProject(id);

    if (!deleted) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error en controller.deleteProject:", error);
    res.status(500).json({ error: "Error al eliminar proyecto" });
  }
};

export const iniciarProyecto = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const proyecto = await projectService.iniciarProyectoService(projectId, userId);
    res.json({
      message: "✅ Proyecto iniciado correctamente",
      proyecto: {
        id: proyecto._id,
        nombre: proyecto.nombre,
        fechaInicioReal: proyecto.fechaInicioReal,
        estado: proyecto.estado,
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const pausarProyecto = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const proyecto = await projectService.pausarProyectoService(projectId, userId);
    res.json({
      message: "✅ Proyecto pausado correctamente",
      proyecto: {
        id: proyecto._id,
        nombre: proyecto.nombre,
        estado: proyecto.estado,
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const finalizarProyecto = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const proyecto = await projectService.finalizarProyectoService(projectId, userId);
    res.json({
      message: "✅ Proyecto finalizado correctamente",
      proyecto: {
        id: proyecto._id,
        nombre: proyecto.nombre,
        estado: proyecto.estado,
        fechaFinReal: proyecto.fechaFinReal,
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// controllers/proyectoFeedback.controller.js
import { calificarDesarrolladoresProyectoService } from "../projects/project.service.js";

export async function calificarDesarrolladoresProyectoController(req, res) {
  try {
    const { projectId } = req.params;

    // ✅ Ideal: adminId viene del token
    const adminId = req.user._id ;
    
    // (Solo para test si no tenés auth aún)
    // const adminId = req.user?._id || req.body.adminId;

    if (!adminId) {
      return res.status(401).json({ ok: false, message: "No autenticado (adminId отсутствante)" });
    }

    const { calificaciones, notificationId } = req.body;

    const result = await calificarDesarrolladoresProyectoService(
      projectId,
      adminId,
      calificaciones,
      notificationId ?? null
    );

    return res.status(200).json({
      ok: true,
      message: "Feedback del proyecto registrado correctamente",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: "Error al calificar desarrolladores del proyecto",
      error: error.message,
    });
  }
}
