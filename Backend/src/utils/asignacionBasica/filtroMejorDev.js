import { obtenerDiasDisponibles } from "./diasDisponible.js";

/**
 * Selecciona el desarrollador con mayor disponibilidad en un rango de días
 * @param {Array} candidatos - Lista de devs candidatos
 * @param {Date} fechaInicio - Fecha inicio
 * @param {Date} fechaFin - Fecha fin
 * @returns {Object} mejorDev
 */
export function seleccionarMejorDev(candidatos, fechaInicio, fechaFin) {
  // 1. Obtiene la lista de días en el rango
  const diasDisponibles = obtenerDiasDisponibles(fechaInicio, fechaFin);

  // 2. Usa reduce para comparar candidato por candidato
  return candidatos.reduce((a, b) => {
    // 2.1. Calcula las horas totales disponibles del dev "a"
    const horasA = diasDisponibles.reduce((acc, dia) => {
      const registro = a.calendario.find(d =>
        d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
      );
      return acc + (registro ? registro.horasDisponibles : 8);
    }, 0);

    // 2.2. Calcula las horas totales disponibles del dev "b"
    const horasB = diasDisponibles.reduce((acc, dia) => {
      const registro = b.calendario.find(d =>
        d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
      );
      return acc + (registro ? registro.horasDisponibles : 8);
    }, 0);

    // 2.3. Devuelve el que tenga más horas disponibles
    return horasA > horasB ? a : b;
  });
}
