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
    const diaSemana = fecha.getUTCDay();
    if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
      dias.push(new Date(fecha));
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return dias;
}
/* 
export function obtenerDisponibilidadEnRango(dev, fechaInicio, fechaFin) {
  const diasDisponibles = [];
  const fechaActual = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  while (fechaActual <= fin) {
    const iso = fechaActual.toISOString().split("T")[0];
    const horas = dev.horasDisponiblesPorDia?.[iso] || 0;
    const diaSemana = fechaActual.getUTCDay(); // 0 = domingo, 6 = sábado

    // Solo días de semana: lunes (1) a viernes (5)
    if (horas > 0 && diaSemana >= 1 && diaSemana <= 5) {
      diasDisponibles.push({ fecha: iso, horas });
    }

    // Avanza un día
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return diasDisponibles;
} */

export function obtenerDisponibilidadEnRango(dev, fechaInicio, fechaFin) {
  const diasDisponibles = [];
  const fechaActual = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  while (fechaActual <= fin) {
    const iso = fechaActual.toISOString().split("T")[0];
    const diaSemana = fechaActual.getUTCDay(); // 0=dom, 6=sáb

    // solo días hábiles
    if (diaSemana >= 1 && diaSemana <= 5) {
      // buscar en el calendario del dev
      const reg = dev.calendario.find(d =>
        d.fecha.toISOString().split("T")[0] === iso
      );

      if (reg) {
        diasDisponibles.push({ fecha: iso, horas: reg.horasDisponibles });
      }
    }

    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return diasDisponibles;
}
