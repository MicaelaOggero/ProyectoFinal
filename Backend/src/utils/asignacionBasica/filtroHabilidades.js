/**
 * Verifica si un desarrollador cumple con un porcentaje mínimo de habilidades requeridas
 * @param {Object} dev - Usuario desarrollador
 * @param {Array} habilidadesRequeridas - Array de nombres de habilidades de la tarea
 * @param {Number} porcentajeMinimo - Ej: 0.7 = 70%
 * @returns {Boolean}
 */
export function tieneHabilidadesSuficientes(dev, habilidadesRequeridas, porcentajeMinimo = 0.5) {
  if (!habilidadesRequeridas || habilidadesRequeridas.length === 0) return true;

  // Normalizar nombres: todo a minúsculas y quitar espacios iniciales/finales
  const habDev = dev.habilidades.map(h => h.nombre.trim().toLowerCase());
  const habReq = habilidadesRequeridas.map(h => h.trim().toLowerCase());

  // Contar cuántas habilidades requeridas tiene el dev
  const cantidadCumplida = habReq.filter(h => habDev.includes(h)).length;

  // Verificar porcentaje mínimo
  return cantidadCumplida / habReq.length >= porcentajeMinimo;
}
