import Project from '../projects/project.model.js';
import Task from '../task/task.model.js';
import User from '../users/user.model.js';

// Validar todas las referencias antes de modificar calendarios o crear asignaciones.
export async function validarAsignacionesEmpresa(projectId, asignaciones) {
  const project = await Project.findById(projectId).select('_id empresa').lean();
  if (!project) throw new Error('Proyecto no encontrado');
  const taskIds = asignaciones.map(item => item.tareaId);
  const developerIds = asignaciones.map(item => item.desarrolladorId);
  const [tasks, developers] = await Promise.all([
    Task.find({ _id: { $in: taskIds }, proyecto: project._id }).select('_id').lean(),
    User.find({ _id: { $in: developerIds }, rol: 'user', empresa: project.empresa ?? null }).select('_id').lean(),
  ]);
  const validTasks = new Set(tasks.map(task => String(task._id)));
  const validDevelopers = new Set(developers.map(developer => String(developer._id)));
  if (asignaciones.some(item => !validTasks.has(String(item.tareaId)) || !validDevelopers.has(String(item.desarrolladorId)))) {
    throw new Error('Una tarea o un desarrollador no pertenece al proyecto o a su empresa');
  }
}
