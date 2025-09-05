/**
 * Verifica si un desarrollador tiene suficiente disponibilidad
 * @param {Object} dev - usuario (desarrollador)
 * @param {Number} duracionHoras - tiempo estimado de la tarea
 * @returns {Boolean} - true si tiene disponibilidad suficiente
 */
export function tieneDisponibilidad(dev, duracionHoras) {
  return dev.disponibilidadSemanal >= duracionHoras;
}

/**
 * Filtra un array de desarrolladores y devuelve solo los que tienen suficiente disponibilidad
 * @param {Array} devs - array de usuarios
 * @param {Number} duracionHoras - horas requeridas por la tarea
 * @returns {Array} - devs válidos
 */
export function filtrarPorDisponibilidad(devs, duracionHoras) {
  return devs.filter(dev => tieneDisponibilidad(dev, duracionHoras));
}
