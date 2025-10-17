/**
 * Devuelve los días disponibles entre fechaInicio y fechaFin
 * Considera fines de semana según la propiedad del desarrollador
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @param {Object} dev - desarrollador con propiedad trabajaFinesDeSemana
 * @returns {Date[]} arreglo de días disponibles
 */
export function obtenerDiasDisponibles(fechaInicio, fechaFin) {
  const dias = [];
  let fecha = new Date(fechaInicio);

  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay();
    if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
      dias.push(new Date(fecha));
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return dias;
}

export function obtenerDisponibilidadEnRango(dev, fechaInicio, fechaFin) {
  const diasDisponibles = [];
  const fechaActual = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  while (fechaActual <= fin) {
    const iso = fechaActual.toISOString().split("T")[0];
    const horas = dev.horasDisponiblesPorDia?.[iso] || 0;
    const esFinDeSemana = [0, 6].includes(fechaActual.getDay());

    if (horas > 0 && (dev.trabajaFinesDeSemana || !esFinDeSemana)) {
      diasDisponibles.push({ fecha: iso, horas });
    }

    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return diasDisponibles;
}

