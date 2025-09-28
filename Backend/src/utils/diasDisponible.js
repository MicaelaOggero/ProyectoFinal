/**
 * Devuelve los días disponibles entre fechaInicio y fechaFin
 * Considera fines de semana según la propiedad del desarrollador
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @param {Object} dev - desarrollador con propiedad trabajaFinesDeSemana
 * @returns {Date[]} arreglo de días disponibles
 */
export function obtenerDiasDisponibles(fechaInicio, fechaFin, dev) {
  const dias = [];
  let fecha = new Date(fechaInicio);

  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay(); // 0=domingo, 6=sábado
    if (dev.trabajaFinesDeSemana || (diaSemana >= 1 && diaSemana <= 5)) {
      dias.push(new Date(fecha));
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return dias;
}
