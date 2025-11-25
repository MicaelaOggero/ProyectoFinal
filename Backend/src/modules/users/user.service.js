import * as userDao from "./user.dao.js";
import Project from "../projects/project.model.js";
import Task from "../task/task.model.js"; 
// services/iaAssignment.service.js
import TaskLog from "../task/taskLog.model.js";
import User from "./user.model.js";
import PerformanceFeedback from "../performanceFeedback/performanceFeedback.model.js";


// Obtener todos los usuarios (si es admin devuelve los 'user', si es user devuelve lista vacía)
export const getUsers = async (rol) => {
  if (rol === "admin") {
    return await userDao.findUsersByRole("user");
  }
  if (rol === "user") {
    return [];
  }
  throw new Error("Rol no autorizado");
};

// Obtener un usuario por ID
export const getUserById = async (id) => {
  return await userDao.findUserById(id);
};

// Actualizar un usuario
export const updateUser = async (id, data) => {
  return await userDao.updateUser(id, data);
};

// Eliminar un usuario
export const deleteUser = async (id) => {
  const usuario = await userDao.findUserById(id);
  if (!usuario) return null;

  // Si el usuario es admin, revisar proyectos asociados
  if (usuario.rol === "admin") {
    const proyectos = await Project.find({ administrador: usuario._id });
    if (proyectos.length > 0) {
      throw new Error("No se puede eliminar un admin que tenga proyectos asociados");
    }
  }

  return await userDao.deleteUser(id);
};

// Función auxiliar para generar calendario de un año completo (solo días hábiles)
export async function generarCalendarioAnual() {
  const calendario = [];
  const inicio = new Date(); // fecha de creación del usuario
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(inicio);
  fin.setFullYear(fin.getFullYear() + 1); // un año completo

  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado

    // Solo lunes a viernes (1–5)
    if (diaSemana >= 1 && diaSemana <= 5) {
      calendario.push({ fecha: new Date(d), horasDisponibles: 8 });
    } 
  }

  return calendario;
}


/**
 * Obtener calendario de un desarrollador
 * @param {String} userId - ID del usuario
 * @param {String|null} month - Mes a filtrar (formato "YYYY-MM")
 */
export const obtenerCalendarioService = async (userId, month = null) => {
  const user = await userDao.findUserById(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Si no tiene calendario, inicializarlo vacío
  if (!user.calendario) {
    user.calendario = [];
    await userDao.saveUser(user);
  }

  if (!month) {
    return user.calendario;
  }

  // Filtrar calendario por mes
  const [year, monthNumber] = month.split("-");
  const calendarioFiltrado = user.calendario.filter(entry => {
    const fecha = new Date(entry.fecha);
    return (
      fecha.getUTCFullYear() === parseInt(year) &&
      fecha.getUTCMonth() + 1 === parseInt(monthNumber)
    );
  });

  return calendarioFiltrado;
};

/**
 * Editar calendario de un desarrollador
 * @param {String} userId - ID del desarrollador
 * @param {Array} cambios - [{ fecha, horasDisponibles }]
 */
export const editarCalendarioService = async (userId, cambios) => {
  const dev = await userDao.findUserById(userId);
  if (!dev) throw new Error("Desarrollador no encontrado");

  for (const cambio of cambios) {
    const fechaISO = new Date(cambio.fecha).toISOString().split("T")[0];

    // 1️⃣ Verificar si hay tareas asignadas a ese día
    const tareasAsignadas = await Task.find({
      desarrolladorAsignado: dev._id,
      fechaEstimadaInicio: { $lte: new Date(cambio.fecha) },
      fechaEstimadaFin: { $gte: new Date(cambio.fecha) }
    });

    if (tareasAsignadas.length > 0) {
      // no permitir editar
      throw new Error(
        `No se puede modificar ${fechaISO}, tiene tareas asignadas.`
      );
    }

    // 2️⃣ Buscar el día en el calendario
    let reg = dev.calendario.find(d =>
      d.fecha.toISOString().split("T")[0] === fechaISO
    );

    if (reg) {
      reg.horasDisponibles = cambio.horasDisponibles;
    } else {
      dev.calendario.push({
        fecha: new Date(cambio.fecha),
        horasDisponibles: cambio.horasDisponibles
      });
    }
  }

  await userDao.saveUser(dev);
  return dev;
};

export async function verificarYActualizarCalendario(desarrollador) {
  const calendario = desarrollador.calendario || [];
  if (calendario.length === 0) {
    // Si no tiene calendario, lo creamos completo
    desarrollador.calendario = await generarCalendarioAnual();
    return desarrollador;
  }

  // Última fecha del calendario actual
  const ultimaFecha = new Date(calendario[calendario.length - 1].fecha);

  // Fecha de referencia: un mes antes de que se acabe el calendario
  const unMesAntes = new Date(ultimaFecha);
  unMesAntes.setMonth(unMesAntes.getMonth() - 1);

  const hoy = new Date();

  // Si hoy es posterior a "un mes antes del fin", generamos otro calendario
  if (hoy >= unMesAntes) {
    console.log("⏰ Renovando calendario del desarrollador...");

    const nuevoCalendario = await generarCalendarioAnual();

    // Evitar duplicar días: solo agregar los que vienen después del último día actual
    const fechaLimite = ultimaFecha.getTime();
    const nuevosDias = nuevoCalendario.filter(
      (dia) => new Date(dia.fecha).getTime() > fechaLimite
    );

    desarrollador.calendario.push(...nuevosDias);
  }

  return desarrollador;
}


export async function actualizarRendimientoDesarrollador(userId) {
  // Obtener todos los logs del desarrollador
  const logs = await TaskLog.find({ desarrollador: userId });

  if (logs.length === 0) return; // No hay tareas registradas aún

  // Calcular el promedio real de rendimiento
  let sumaPorcentajes = 0;

  for (const log of logs) {
    const rendimiento = (log.tiempoInvertidoHoras / log.duracionEstimadaHoras) * 100;
    sumaPorcentajes += rendimiento;
  }

  const promedio = sumaPorcentajes / logs.length;

  // Guardar en el usuario
  await User.findByIdAndUpdate(userId, {
    $set: {
      "rendimientoHistorico.promedioPorcentaje": promedio,
      "rendimientoHistorico.tareasCompletadas": logs.length,
    },
  });

  return promedio;
}


export async function actualizarCalendariosDeTodosLosDesarrolladores() {
  try {
    const desarrolladores = await User.find({ rol: "user" });

    for (const dev of desarrolladores) {
      await verificarYActualizarCalendario(dev);
      await dev.save(); // guardar si hubo cambios
    }

    return { success: true, totalActualizados: desarrolladores.length };
  } catch (error) {
    console.error("Error actualizando calendarios:", error);
    return { success: false, error: error.message };
  }
}

/* (async () => {
  await actualizarCalendariosDeTodosLosDesarrolladores();
})(); */

export async function actualizarPuntuacionCalidadDesarrollador(userId) {
  // Obtener todos los logs del desarrollador
  const logs = await TaskLog.find({ desarrollador: userId });
  if (logs.length === 0) return; // No hay tareas registradas aún

  // Calcular el promedio de puntuación de calidad
  let sumaPuntuaciones = 0;
  for (const log of logs) {
    sumaPuntuaciones += log.puntuacionCalidad;
  }
  const promedioCalidad = sumaPuntuaciones / logs.length;

  // Guardar en el usuario
  await User.findByIdAndUpdate(userId, {
    $set: {
      "puntuacionPromedioCalidad.puntuacionPromedio": promedioCalidad,
      "puntuacionPromedioCalidad.tareasCalificadas": logs.length,
    },
  });
  return promedioCalidad;
}

export async function actualizarPuntuacionesCalidadDeTodosLosDesarrolladores() {
  try {
    const desarrolladores = await User.find({ rol: "user" });
    for (const dev of desarrolladores) {
      await actualizarPuntuacionCalidadDesarrollador(dev._id);
    }
    return { success: true, totalActualizados: desarrolladores.length };
  }
  catch (error) {
    console.error("Error actualizando puntuaciones de calidad:", error);
    return { success: false, error: error.message };
  }
}

 /* (async () => {
  await actualizarPuntuacionesCalidadDeTodosLosDesarrolladores();
})();   */
import mongoose from "mongoose";

export async function actualizarFeedbackHistoricoDesarrollador(userId) {
  // agregamos todos los feedbacks del desarrollador y calculamos promedio
  const resultado = await PerformanceFeedback.aggregate([
    { $match: { desarrollador: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$desarrollador",
        promedio: { $avg: "$puntuacion" },
        vecesCalificado: { $sum: 1 }
      }
    }
  ]);

  if (!resultado.length) return; // no hay feedbacks

  const { promedio, vecesCalificado } = resultado[0];

  // guardar en el usuario
  await User.findByIdAndUpdate(userId, {
    $set: {
      "feedbackHistorico.puntuacionPromedio": promedio,
      "feedbackHistorico.vecesCalificado": vecesCalificado
    }
  });

  return promedio;
}

// actualizar feedback historico de todos los desarrolladores
export async function actualizarFeedbackHistoricoDeTodosLosDesarrolladores() {
  try {
    const desarrolladores = await User.find({ rol: "user" });
    for (const dev of desarrolladores) {
      await actualizarFeedbackHistoricoDesarrollador(dev._id);
    }
    return { success: true, totalActualizados: desarrolladores.length };
  } catch (error) {
    console.error("Error actualizando feedback historico:", error);
    return { success: false, error: error.message };
  }
}


/*    (async () => {
  await actualizarFeedbackHistoricoDeTodosLosDesarrolladores();
})();      */