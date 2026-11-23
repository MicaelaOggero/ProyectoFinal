import User from '../../modules/users/user.model.js';
import Asignacion from '../../modules/assignment/assignment.model.js';

export function verificarHorasPorDia(asignaciones, desarrolladores) {
  const usuarios = new Map(desarrolladores.map(dev => [String(dev._id), dev]));
  const acumulado = new Map();
  for (const asignacion of asignaciones) {
    const dev = usuarios.get(String(asignacion.desarrolladorId));
    if (!dev) throw new Error('No se encontró uno de los desarrolladores. Volvé a generar la simulación.');
    for (const dia of asignacion.dias || []) {
      const fecha = new Date(dia.fecha);
      const horas = Number(dia.horasAsignadas);
      if (Number.isNaN(fecha.getTime()) || !Number.isFinite(horas) || horas <= 0) {
        throw new Error('La distribución contiene una fecha u horas inválidas. Volvé a generar la simulación.');
      }
      const claveFecha = fecha.toISOString().slice(0, 10);
      const clave = `${dev._id}:${claveFecha}`;
      const registro = (dev.calendario || []).find(d => new Date(d.fecha).toISOString().slice(0, 10) === claveFecha);
      const disponibles = Number(registro?.horasDisponibles) || 0;
      const total = (acumulado.get(clave) || 0) + horas;
      if (total > disponibles + 1e-8) {
        throw new Error(`${dev.nombre || 'El desarrollador'} tiene ${disponibles} horas disponibles el ${claveFecha}, pero las tareas requieren ${total}. Volvé a distribuir las horas.`);
      }
      acumulado.set(clave, total);
    }
  }
}

export async function validarDisponibilidadConfirmacion(asignaciones) {
  const idsTareas = asignaciones.map(a => a.tareaId);
  const idsDev = [...new Set(asignaciones.map(a => String(a.desarrolladorId)))];
  const [existentes, desarrolladores] = await Promise.all([
    Asignacion.find({ tarea: { $in: idsTareas } }).select('tarea').lean(),
    User.find({ _id: { $in: idsDev } }).select('nombre calendario').lean()
  ]);
  if (existentes.length) throw new Error('Una o más tareas ya tienen asignación. Actualizá la página antes de continuar.');
  if (new Set(idsTareas.map(String)).size !== idsTareas.length) throw new Error('La simulación contiene una tarea repetida.');
  verificarHorasPorDia(asignaciones, desarrolladores);
}
