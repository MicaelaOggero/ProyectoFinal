import {
  importDevelopers,
  importSkills,
  importProjects,
  importTasks
} from "./import.service.js";

function handleImport(service, field) {
  return async (req, res) => {
    try {
      const data = Array.isArray(req.body) ? req.body : req.body?.[field];
      const result = await service(data, req.user._id);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}

export const importarDesarrolladores = handleImport(importDevelopers, "desarrolladores");
export const importarHabilidades = handleImport(importSkills, "habilidades");
export const importarProyectos = handleImport(importProjects, "proyectos");
export const importarTareas = handleImport(importTasks, "tareas");
