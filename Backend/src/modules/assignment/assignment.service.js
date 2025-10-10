import { findAsignacionById, saveAsignacion, saveUser, saveTask, findAsignacionesByProyecto } from "./assignment.dao.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js"; // tu función que ya verifica horas
import { findUserById } from "../users/user.dao.js";
import { asignarTareasConCalendario } from "../criteria/index.js";
import { asignarTareasPorCosto } from "../criteria/costo.js";

export const editarAsignacionService = async (asignacionId, nuevoDevId) => {
  // 1. Buscar la asignación original
  const asignacion = await findAsignacionById(asignacionId);
  if (!asignacion) throw new Error("Asignación no encontrada");
  const tarea = asignacion.tarea;
  const devOriginal = asignacion.desarrollador;
  const devNuevo = await findUserById(nuevoDevId);
  if (!devNuevo) throw new Error("Nuevo desarrollador no encontrado");

  // 1b. Verificar si el nuevo dev tiene disponibilidad suficiente
  const fechaInicio = new Date(tarea.fechaEstimadaInicio);
  const fechaFin = new Date(tarea.fechaEstimadaFin);
  const horasNecesarias = tarea.tiempoEstimadoHoras;

  const disponible = tieneDisponibilidad(devNuevo, fechaInicio, fechaFin, horasNecesarias);
  if (!disponible) {
    throw new Error("El nuevo desarrollador no tiene disponibilidad suficiente en las fechas de la tarea");
  }

  // 2. Restaurar disponibilidad al dev original
  asignacion.dias.forEach(dia => {
    const reg = devOriginal.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === new Date(dia.fecha).toISOString().split("T")[0]
    );
    if (reg) reg.horasDisponibles += dia.horasAsignadas;
  });
  await saveUser(devOriginal);

  // 3. Actualizar tarea con nuevo dev
  tarea.desarrolladorAsignado = devNuevo._id;
  await saveTask(tarea);

  // 4. Descontar horas al nuevo dev
  let horasRestantes = horasNecesarias;
  const nuevosDias = [];

  for (const dia of asignacion.dias) {
    if (horasRestantes <= 0) break;

    const diaISO = new Date(dia.fecha).toISOString().split("T")[0];
    let reg = devNuevo.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === diaISO
    );

    if (!reg) {
      reg = { fecha: new Date(dia.fecha), horasDisponibles: 8 };
      devNuevo.calendario.push(reg);
    }

    const horasAsignadas = Math.min(reg.horasDisponibles, horasRestantes);
    reg.horasDisponibles -= horasAsignadas;
    horasRestantes -= horasAsignadas;

    nuevosDias.push({ fecha: new Date(dia.fecha), horasAsignadas });
  }

  await saveUser(devNuevo);

  // 5. Actualizar la asignación
  asignacion.desarrollador = devNuevo._id;
  asignacion.dias = nuevosDias;
  await saveAsignacion(asignacion);

  return asignacion;
};

export const getAsignacionesPorProyectoService = async (proyectoId) => {
  const asignaciones = await findAsignacionesByProyecto(proyectoId);

  if (!asignaciones || asignaciones.length === 0) {
    throw new Error("No se encontraron asignaciones para este proyecto");
  }

  const asignacionesValidas = asignaciones.filter(a => a.tarea && a.desarrollador);

  // Podés formatear la respuesta si no querés mandar todo crudo
  return asignacionesValidas.map(asig => ({
    asignacionId: asig._id,
    tarea: {
      id: asig.tarea._id,
      descripcion: asig.tarea.descripcion,
      fechaEstimadaInicio: asig.tarea.fechaEstimadaInicio,
      fechaEstimadaFin: asig.tarea.fechaEstimadaFin,
      tiempoEstimadoHoras: asig.tarea.tiempoEstimadoHoras,
      estado: asig.tarea.estado,
    },
    desarrollador: {
      id: asig.desarrollador._id,
      nombre: asig.desarrollador.nombre,
      habilidades: asig.desarrollador.habilidades,
    },
    dias: asig.dias, // [{ fecha, horasAsignadas }]
  }));
};

export async function asignarTareasBasico(projectId) {
  return await asignarTareasConCalendario(projectId);
}

export const asignarPorCostoService = async (projectId) => {
  return await asignarTareasPorCosto(projectId);
};

