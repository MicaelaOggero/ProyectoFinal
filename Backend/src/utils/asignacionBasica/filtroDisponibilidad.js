import { obtenerDiasDisponibles, obtenerDisponibilidadEnRango } from "./diasDisponible.js";

/**
 * Verifica si un desarrollador tiene disponibilidad suficiente en el rango
 * @param {Object} dev - Documento del usuario (con calendario)
 * @param {Date} fechaInicio - Fecha estimada de inicio
 * @param {Date} fechaFin - Fecha estimada de fin
 * @param {Number} horasNecesarias - Horas totales que requiere la tarea
 */
/* export function tieneDisponibilidad(dev, fechaInicio, fechaFin, horasNecesarias) {
  // 1. Obtiene la lista de días hábiles (o con fines de semana según config)
  const diasDisponibles = obtenerDiasDisponibles(fechaInicio, fechaFin);

  let horasTotales = 0;

  // 2. Recorre cada día en el rango
  for (const dia of diasDisponibles) {
    const diaISO = dia.toISOString().split("T")[0]; // formato "YYYY-MM-DD"

    // 3. Busca en el calendario del dev si existe un registro para ese día
    const registroDia = dev.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === diaISO
    );

    // 4. Suma las horas disponibles del día:
    //    - Si está en el calendario, usa "registroDia.horasDisponibles"
    //    - Si no está en el calendario, asume 8 horas por defecto
    horasTotales += registroDia ? registroDia.horasDisponibles : 8;
  }

  // 5. Devuelve true si el total de horas alcanzan lo requerido
  return horasTotales >= horasNecesarias;
} */

export function tieneDisponibilidad(dev, fechaInicio, fechaFin, horasNecesarias) {
  const diasDisponibles = obtenerDisponibilidadEnRango(dev, fechaInicio, fechaFin);
  console.log("Días disponibles en rango:", diasDisponibles);

  let horasTotales = 0;

  for (const dia of diasDisponibles) {
    horasTotales += dia.horas;
  }

  return horasTotales >= horasNecesarias;
}
