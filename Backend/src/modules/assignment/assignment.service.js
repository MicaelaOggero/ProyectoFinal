import { findAsignacionById, saveAsignacion, saveUser, saveTask, findAsignacionesByProyecto } from "./assignment.dao.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js"; // tu función que ya verifica horas
import { findUserById } from "../users/user.dao.js";
import { asignarTareasConCalendario } from "../criteria/index.js";
import { asignarTareasPorCosto } from "../criteria/costo.js";
import { calcularCostoDev } from "../../utils/asignacionCosto/costoTarea.js";
import Task from "../task/task.model.js";

export const editarAsignacionService = async (asignacionId, nuevoDevId) => {
  // 1. Buscar la asignación original
  const asignacion = await findAsignacionById(asignacionId);
  if (!asignacion) throw new Error("Asignación no encontrada");

  const tarea = asignacion.tarea;
  const devOriginal = asignacion.desarrollador;
  const devNuevo = await findUserById(nuevoDevId);
  if (!devNuevo) throw new Error("Nuevo desarrollador no encontrado");

  // 2. Verificar disponibilidad
  const fechaInicio = new Date(tarea.fechaEstimadaInicio);
  const fechaFin = new Date(tarea.fechaEstimadaFin);
  const horasNecesarias = tarea.tiempoEstimadoHoras;

  const disponible = tieneDisponibilidad(devNuevo, fechaInicio, fechaFin, horasNecesarias);
  if (!disponible) {
    throw new Error("El nuevo desarrollador no tiene disponibilidad suficiente en las fechas de la tarea");
  }

  // 3. Restaurar horas al dev original
  asignacion.dias.forEach(dia => {
    const reg = devOriginal.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === new Date(dia.fecha).toISOString().split("T")[0]
    );
    if (reg) reg.horasDisponibles += dia.horasAsignadas;
  });
  await saveUser(devOriginal);

  // 4. Asignar nuevo dev a la tarea
  tarea.desarrolladorAsignado = devNuevo._id;

  // 5. Descontar horas al nuevo dev
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

  // ✅ 6. Calcular nuevo costo de la tarea y actualizarla
  const costoTarea = calcularCostoDev(devNuevo, tarea.tiempoEstimadoHoras);
  tarea.costoTarea = costoTarea;
  await saveTask(tarea);

  // ✅ 7. Recalcular costo total del proyecto
  const proyecto = tarea.proyecto;
  const tareasProyecto = await Task.find({ proyecto: proyecto._id }).populate("desarrolladorAsignado");

  let costoTotalProyecto = 0;
  for (const t of tareasProyecto) {
    const devTarea = t.desarrolladorAsignado;
    if (devTarea) {
      const costo = calcularCostoDev(devTarea, t.tiempoEstimadoHoras);
      costoTotalProyecto += costo;
    }
  }

  proyecto.costoTotal = costoTotalProyecto;
  await proyecto.save();

  // ✅ 8. Actualizar la asignación
  asignacion.desarrollador = devNuevo._id;
  asignacion.dias = nuevosDias;
  asignacion.costoTarea = costoTarea; // ← guardar el costo también en la asignación
  await saveAsignacion(asignacion);

  // 🆕 9. Registrar la razón del cambio
  asignacion.razon = "Desarrollador cambiado manualmente";

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
    tipoAsignacion: asig.tipoAsignacion,
  }));
};

export async function asignarTareasBasico(projectId) {
  return await asignarTareasConCalendario(projectId);
}

export const asignarPorCostoService = async (projectId) => {
  return await asignarTareasPorCosto(projectId);
};

