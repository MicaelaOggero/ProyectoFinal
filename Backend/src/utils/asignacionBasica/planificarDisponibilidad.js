import { normalizarHabilidad } from './normalizarHabilidad.js';

// Usa exclusivamente días que existen en el calendario: no inventa disponibilidad futura.
export function analizarDisponibilidad(dev, tarea) {
  const inicio = new Date(tarea.fechaEstimadaInicio).toISOString().slice(0, 10);
  const fin = new Date(tarea.fechaEstimadaFin).toISOString().slice(0, 10);
  const necesarias = Number(tarea.estimacionHoras);
  const nombresRequeridos = tarea.habilidadesRequeridas || [];
  const requeridas = nombresRequeridos.map(normalizarHabilidad);
  const habilidades = new Set((dev.habilidades || []).map(h => normalizarHabilidad(h.nombre)));
  const coincidentes = requeridas.filter(h => habilidades.has(h));
  const dias = (dev.calendario || [])
    .map(d => ({ fecha: new Date(d.fecha).toISOString().slice(0, 10), horas: Math.max(0, Number(d.horasDisponibles) || 0) }))
    .filter(d => d.fecha >= inicio && d.horas > 0 && ![0, 6].includes(new Date(`${d.fecha}T00:00:00Z`).getUTCDay()))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const horasEnPlazo = dias.filter(d => d.fecha <= fin).reduce((sum, d) => sum + d.horas, 0);
  let acumuladas = 0;
  let fechaFinAlternativa = null;
  for (const dia of dias) {
    acumuladas += dia.horas;
    if (acumuladas >= necesarias) {
      fechaFinAlternativa = dia.fecha;
      break;
    }
  }
  return {
    horasEnPlazo,
    horasNecesarias: necesarias,
    habilidadesCoincidentes: coincidentes.length,
    habilidadesRequeridas: requeridas.length,
    habilidadesFaltantes: nombresRequeridos.filter(h => !habilidades.has(normalizarHabilidad(h))),
    cumpleHabilidades: requeridas.length === 0 || coincidentes.length / requeridas.length >= 0.5,
    disponibleEnPlazo: horasEnPlazo >= necesarias,
    fechaFinAlternativa
  };
}
