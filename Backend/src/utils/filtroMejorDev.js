import { obtenerDiasDisponibles } from "./diasDisponible.js";

/**
 * Selecciona el desarrollador con mayor disponibilidad en un rango de días
 * @param {Array} candidatos - Lista de devs candidatos
 * @param {Date} fechaInicio - Fecha inicio
 * @param {Date} fechaFin - Fecha fin
 * @returns {Object} mejorDev
 */
export function seleccionarMejorDev(candidatos, fechaInicio, fechaFin) {
  const diasDisponibles = obtenerDiasDisponibles(fechaInicio, fechaFin);

  return candidatos.reduce((a, b) => {
    const horasA = diasDisponibles.reduce((acc, dia) => {
      const registro = a.calendario.find(d =>
        d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
      );
      return acc + (registro ? registro.horasDisponibles : 8);
    }, 0);

    const horasB = diasDisponibles.reduce((acc, dia) => {
      const registro = b.calendario.find(d =>
        d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
      );
      return acc + (registro ? registro.horasDisponibles : 8);
    }, 0);

    return horasA > horasB ? a : b;
  });
}
