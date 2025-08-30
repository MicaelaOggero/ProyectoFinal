import Task from "../tasks/task.model.js";

/**
 * Verifica que un dev tenga todas las habilidades requeridas por la tarea
 */
export function tieneHabilidadesMinimas(dev, habilidadesRequeridas) {
  return habilidadesRequeridas.every(hab =>
    dev.habilidades.some(h => h.nombre === hab)
  );
}

/**
 * Verifica si el dev tiene suficiente disponibilidad para la tarea
 * @param {Object} dev - Usuario
 * @param {Number} duracionHoras - Tiempo estimado de la tarea en horas
 */
export function tieneDisponibilidad(dev, duracionHoras) {
  // Suponiendo que la disponibilidadSemanal es horas disponibles por semana
  return dev.disponibilidadSemanal >= duracionHoras;
}

/**
 * Filtra candidatos válidos combinando habilidades y disponibilidad
 * @param {Array} devs - lista de desarrolladores
 * @param {Array} habilidadesRequeridas - habilidades necesarias para la tarea
 * @param {Number} duracionHoras - tiempo estimado de la tarea en horas
 */
export async function filtrarCandidatosValidados(devs, habilidadesRequeridas, duracionHoras) {
  const candidatos = [];

  for (const dev of devs) {
    // Filtrar por habilidades
    if (!tieneHabilidadesMinimas(dev, habilidadesRequeridas)) continue;

    // Filtrar por disponibilidad
    if (!tieneDisponibilidad(dev, duracionHoras)) continue;

    candidatos.push(dev);
  }

  return candidatos;
}
