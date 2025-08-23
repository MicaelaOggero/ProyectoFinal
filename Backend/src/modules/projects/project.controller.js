import * as projectService from "./project.service.js";

// Obtener todos los proyectos de un admin
export const getProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects(req.userId);
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
    const administradorId = req.userId;
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
