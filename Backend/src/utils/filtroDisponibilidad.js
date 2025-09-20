// 👉 genera rango de días hábiles (lunes a viernes)
function generarRangoDias(fechaInicio, fechaFin) {
  const dias = [];
  let fecha = new Date(fechaInicio);
  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay();
    if (diaSemana >= 1 && diaSemana <= 5) {
      dias.push(new Date(fecha));
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  return dias;
}

/**
 * Verifica si un desarrollador tiene disponibilidad suficiente en el rango
 * @param {Object} dev - Documento del usuario (con calendario)
 * @param {Date} fechaInicio - Fecha estimada de inicio
 * @param {Date} fechaFin - Fecha estimada de fin
 * @param {Number} horasNecesarias - Horas totales que requiere la tarea
 */
export function tieneDisponibilidad(dev, fechaInicio, fechaFin, horasNecesarias) {
  const diasDisponibles = generarRangoDias(fechaInicio, fechaFin);

  let horasTotales = 0;
  for (const dia of diasDisponibles) {
    const diaISO = dia.toISOString().split("T")[0];
    const registroDia = dev.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === diaISO
    );

    horasTotales += registroDia ? registroDia.horasDisponibles : 8;
  }

  return horasTotales >= horasNecesarias;
}
