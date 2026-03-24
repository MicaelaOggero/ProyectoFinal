import SesionTrabajo from "../task/sesionTrabajo.js";
import TaskLog from "../task/taskLog.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import Project from "../projects/project.model.js";
import { createFinalProjectReport, findLatestSimulationByProject } from "./report.dao.js";

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function avg(sum, count) {
  if (!count) return 0;
  return Number((sum / count).toFixed(2));
}

function isDateInRange(date, start, end) {
  if (!date) return false;
  const d = new Date(date);
  return d >= start && d < end;
}

function parseDateRange(weekStart, weekEnd) {
  if (!weekStart || !weekEnd) {
    throw new Error("weekStart y weekEnd son requeridos");
  }

  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("weekStart o weekEnd no son fechas válidas");
  }

  if (end <= start) {
    throw new Error("weekEnd debe ser mayor que weekStart");
  }

  return { start, end };
}

export async function getWeeklyDeveloperMetrics({ projectId, weekStart, weekEnd } = {}) {
  if (!projectId) throw new Error("projectId es requerido");

  const { start, end } = parseDateRange(weekStart, weekEnd);

  const [sessions, taskLogs, tasks] = await Promise.all([
    SesionTrabajo.find({
      proyectoId: projectId,
      estado: "cerrada",
      fechaFin: { $gte: start, $lt: end },
    }).lean(),
    TaskLog.find({
      proyecto: projectId,
      creadoEn: { $gte: start, $lt: end },
    }).lean(),
    Task.find({ proyecto: projectId })
      .select("_id desarrolladorAsignado estado fechaEstimadaFin")
      .lean(),
  ]);

  const devIds = new Set();
  sessions.forEach((s) => devIds.add(String(s.desarrolladorAsignado)));
  taskLogs.forEach((l) => devIds.add(String(l.desarrollador)));
  tasks.forEach((t) => {
    if (t.desarrolladorAsignado) devIds.add(String(t.desarrolladorAsignado));
  });

  const users = await User.find({ _id: { $in: Array.from(devIds) } })
    .select("nombre apellido costoPorHora")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const metricsByDev = new Map();
  const tasksEnProgresoByDev = new Map();
  const tareasRetrasadasByDev = new Map();

  function ensureDev(devId) {
    if (!metricsByDev.has(devId)) {
      const user = userMap.get(devId) || {};
      metricsByDev.set(devId, {
        desarrolladorId: devId,
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        horasTrabajadas: 0,
        costoTotal: 0,
        tareasCompletadas: 0,
        tareasEnProgreso: 0,
        tareasRetrasadas: 0,
        promedioCalidad: 0,
        promedioRendimiento: 0,
        _sumCalidad: 0,
        _countCalidad: 0,
        _sumRend: 0,
        _countRend: 0,
      });
    }
    return metricsByDev.get(devId);
  }

  const taskIdsWithSessions = new Set(sessions.map((s) => String(s.tareaId)));

  for (const session of sessions) {
    const devId = String(session.desarrolladorAsignado);
    const metric = ensureDev(devId);
    metric.horasTrabajadas += safeNumber(session.tiempoTrabajadoHoras);
  }

  for (const log of taskLogs) {
    const devId = String(log.desarrollador);
    const metric = ensureDev(devId);

    if (log.estado !== "cancelada") {
      metric.tareasCompletadas += 1;
    }

    if (log.puntuacionCalidad != null) {
      const calidad = safeNumber(log.puntuacionCalidad);
      if (calidad > 0) {
        metric._sumCalidad += calidad;
        metric._countCalidad += 1;
      }
    }

    const est = safeNumber(log.duracionEstimadaHoras);
    const inv = safeNumber(log.tiempoInvertidoHoras);
    if (est > 0 && inv > 0) {
      const rendimiento = (est / inv) * 100;
      if (Number.isFinite(rendimiento)) {
        metric._sumRend += rendimiento;
        metric._countRend += 1;
      }
    }

    if (log.estado === "retrasada") {
      const set = tareasRetrasadasByDev.get(devId) || new Set();
      set.add(String(log.tarea));
      tareasRetrasadasByDev.set(devId, set);
    }
  }

  for (const task of tasks) {
    if (!task.desarrolladorAsignado) continue;
    const devId = String(task.desarrolladorAsignado);
    ensureDev(devId);

    if (task.estado === "en curso") {
      if (taskIdsWithSessions.has(String(task._id))) {
        const set = tasksEnProgresoByDev.get(devId) || new Set();
        set.add(String(task._id));
        tasksEnProgresoByDev.set(devId, set);
      }
    }

    if (task.estado === "retrasada") {
      const enRango = isDateInRange(task.fechaEstimadaFin, start, end);
      if (enRango || taskIdsWithSessions.has(String(task._id))) {
        const set = tareasRetrasadasByDev.get(devId) || new Set();
        set.add(String(task._id));
        tareasRetrasadasByDev.set(devId, set);
      }
    }
  }

  for (const [devId, metric] of metricsByDev.entries()) {
    const user = userMap.get(devId);
    const costoHora = safeNumber(user?.costoPorHora);
    metric.costoTotal = Number((metric.horasTrabajadas * costoHora).toFixed(2));
    metric.horasTrabajadas = Number(metric.horasTrabajadas.toFixed(2));

    const enProgresoSet = tasksEnProgresoByDev.get(devId) || new Set();
    metric.tareasEnProgreso = enProgresoSet.size;

    const retrasadasSet = tareasRetrasadasByDev.get(devId) || new Set();
    metric.tareasRetrasadas = retrasadasSet.size;

    metric.promedioCalidad = avg(metric._sumCalidad, metric._countCalidad);
    metric.promedioRendimiento = avg(metric._sumRend, metric._countRend);

    delete metric._sumCalidad;
    delete metric._countCalidad;
    delete metric._sumRend;
    delete metric._countRend;
  }

  return {
    projectId,
    weekStart: start,
    weekEnd: end,
    metrics: Array.from(metricsByDev.values()),
  };
}

export async function getWeeklyProjectMetrics({ projectId, weekStart, weekEnd } = {}) {
  if (!projectId) throw new Error("projectId es requerido");

  const { start, end } = parseDateRange(weekStart, weekEnd);

  const [sessions, taskLogs, tasks] = await Promise.all([
    SesionTrabajo.find({
      proyectoId: projectId,
      estado: "cerrada",
      fechaFin: { $gte: start, $lt: end },
    }).lean(),
    TaskLog.find({
      proyecto: projectId,
      creadoEn: { $gte: start, $lt: end },
    }).lean(),
    Task.find({ proyecto: projectId })
      .select("_id desarrolladorAsignado estado fechaEstimadaFin")
      .lean(),
  ]);

  const devIds = new Set();
  sessions.forEach((s) => devIds.add(String(s.desarrolladorAsignado)));
  tasks.forEach((t) => {
    if (t.desarrolladorAsignado) devIds.add(String(t.desarrolladorAsignado));
  });

  const users = await User.find({ _id: { $in: Array.from(devIds) } })
    .select("costoPorHora")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let horasTrabajadas = 0;
  let costoTotal = 0;

  for (const session of sessions) {
    const horas = safeNumber(session.tiempoTrabajadoHoras);
    horasTrabajadas += horas;

    const devId = String(session.desarrolladorAsignado);
    const costoHora = safeNumber(userMap.get(devId)?.costoPorHora);
    costoTotal += horas * costoHora;
  }

  const tareasCompletadas = taskLogs.filter((l) => l.estado !== "cancelada").length;

  const taskIdsWithSessions = new Set(sessions.map((s) => String(s.tareaId)));

  const tareasEnProgreso = new Set();
  const tareasRetrasadas = new Set();

  for (const task of tasks) {
    const taskId = String(task._id);

    if (task.estado === "en curso" && taskIdsWithSessions.has(taskId)) {
      tareasEnProgreso.add(taskId);
    }

    if (task.estado === "retrasada") {
      const enRango = isDateInRange(task.fechaEstimadaFin, start, end);
      if (enRango || taskIdsWithSessions.has(taskId)) {
        tareasRetrasadas.add(taskId);
      }
    }
  }

  let sumCalidad = 0;
  let countCalidad = 0;
  let sumRend = 0;
  let countRend = 0;

  for (const log of taskLogs) {
    if (log.puntuacionCalidad != null) {
      const calidad = safeNumber(log.puntuacionCalidad);
      if (calidad > 0) {
        sumCalidad += calidad;
        countCalidad += 1;
      }
    }

    const est = safeNumber(log.duracionEstimadaHoras);
    const inv = safeNumber(log.tiempoInvertidoHoras);
    if (est > 0 && inv > 0) {
      const rendimiento = (est / inv) * 100;
      if (Number.isFinite(rendimiento)) {
        sumRend += rendimiento;
        countRend += 1;
      }
    }

    if (log.estado === "retrasada") {
      tareasRetrasadas.add(String(log.tarea));
    }
  }

  return {
    projectId,
    weekStart: start,
    weekEnd: end,
    horasTrabajadas: Number(horasTrabajadas.toFixed(2)),
    costoTotal: Number(costoTotal.toFixed(2)),
    tareasCompletadas,
    tareasEnProgreso: tareasEnProgreso.size,
    tareasRetrasadas: tareasRetrasadas.size,
    promedioCalidad: avg(sumCalidad, countCalidad),
    promedioRendimiento: avg(sumRend, countRend),
  };
}

export async function saveProjectFinalReport(projectId) {
  if (!projectId) throw new Error("projectId es requerido");

  const project = await Project.findById(projectId).lean();
  if (!project) throw new Error("Proyecto no encontrado");

  const startDate = project.fechaInicioReal || project.fechaInicioEstimada;
  const endDate = project.fechaFinReal || project.fechaFinEstimada;

  if (!startDate || !endDate) {
    throw new Error("El proyecto no tiene fechas de inicio o fin válidas");
  }

  const [tasks, taskLogs, sessions, simulation] = await Promise.all([
    Task.find({ proyecto: projectId }).lean(),
    TaskLog.find({ proyecto: projectId }).lean(),
    SesionTrabajo.find({ proyectoId: projectId, estado: "cerrada" }).lean(),
    findLatestSimulationByProject(projectId),
  ]);

  if (!simulation) {
    throw new Error("No se encontró una simulación para este proyecto");
  }

  const simulationAssignments = simulation.asignaciones || [];

  const devIds = new Set();
  tasks.forEach((t) => {
    if (t.desarrolladorAsignado) devIds.add(String(t.desarrolladorAsignado));
  });
  taskLogs.forEach((l) => devIds.add(String(l.desarrollador)));
  sessions.forEach((s) => devIds.add(String(s.desarrolladorAsignado)));
  simulationAssignments.forEach((a) => devIds.add(String(a.desarrollador)));

  const users = await User.find({ _id: { $in: Array.from(devIds) } })
    .select("nombre apellido costoPorHora")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let realHoursProject = 0;
  let realCostProject = 0;

  let sumQuality = 0;
  let countQuality = 0;
  let sumRend = 0;
  let countRend = 0;

  let tareasCompletadas = 0;
  let tareasRetrasadas = 0;
  let tareasCanceladas = 0;

  const devMetrics = new Map();

  function ensureDev(devId) {
    if (!devMetrics.has(devId)) {
      const user = userMap.get(devId) || {};
      devMetrics.set(devId, {
        desarrolladorId: devId,
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        expectedHours: 0,
        realHours: 0,
        expectedCost: 0,
        realCost: 0,
        tareasCompletadas: 0,
        tareasRetrasadas: 0,
        promedioCalidad: 0,
        promedioRendimiento: 0,
        _sumCalidad: 0,
        _countCalidad: 0,
        _sumRend: 0,
        _countRend: 0,
      });
    }
    return devMetrics.get(devId);
  }

  for (const assignment of simulationAssignments) {
    const devId = String(assignment.desarrollador);
    const metric = ensureDev(devId);
    const horas = safeNumber(assignment.horasTotales);
    const costo = assignment.costoTotal != null
      ? safeNumber(assignment.costoTotal)
      : safeNumber(assignment.costoPorHora) * horas;

    metric.expectedHours += horas;
    metric.expectedCost += costo;

  }

  for (const session of sessions) {
    const devId = String(session.desarrolladorAsignado);
    const metric = ensureDev(devId);
    const horas = safeNumber(session.tiempoTrabajadoHoras);
    const costoHora = safeNumber(userMap.get(devId)?.costoPorHora);
    const costo = horas * costoHora;

    metric.realHours += horas;
    metric.realCost += costo;

    realHoursProject += horas;
    realCostProject += costo;
  }

  for (const log of taskLogs) {
    const devId = String(log.desarrollador);
    const metric = ensureDev(devId);

    if (log.estado === "cancelada") {
      tareasCanceladas += 1;
    } else {
      tareasCompletadas += 1;
    }

    if (log.estado === "retrasada") {
      tareasRetrasadas += 1;
      metric.tareasRetrasadas += 1;
    }

    if (log.puntuacionCalidad != null) {
      const calidad = safeNumber(log.puntuacionCalidad);
      if (calidad > 0) {
        sumQuality += calidad;
        countQuality += 1;

        metric._sumCalidad += calidad;
        metric._countCalidad += 1;
      }
    }

    const est = safeNumber(log.duracionEstimadaHoras);
    const inv = safeNumber(log.tiempoInvertidoHoras);
    if (est > 0 && inv > 0) {
      const rendimiento = (est / inv) * 100;
      if (Number.isFinite(rendimiento)) {
        sumRend += rendimiento;
        countRend += 1;

        metric._sumRend += rendimiento;
        metric._countRend += 1;
      }
    }

    if (log.estado !== "cancelada") {
      metric.tareasCompletadas += 1;
    }
  }

  const developers = Array.from(devMetrics.values()).map((metric) => {
    metric.expectedHours = Number(metric.expectedHours.toFixed(2));
    metric.realHours = Number(metric.realHours.toFixed(2));
    metric.expectedCost = Number(metric.expectedCost.toFixed(2));
    metric.realCost = Number(metric.realCost.toFixed(2));
    metric.promedioCalidad = avg(metric._sumCalidad, metric._countCalidad);
    metric.promedioRendimiento = avg(metric._sumRend, metric._countRend);

    delete metric._sumCalidad;
    delete metric._countCalidad;
    delete metric._sumRend;
    delete metric._countRend;

    return metric;
  });

  const sessionsByTask = sessions.reduce((acc, s) => {
    const taskId = String(s.tareaId);
    if (!acc[taskId]) acc[taskId] = [];
    acc[taskId].push(s);
    return acc;
  }, {});

  const logsByTask = taskLogs.reduce((acc, l) => {
    const taskId = String(l.tarea);
    acc[taskId] = l;
    return acc;
  }, {});

  const expectedByTask = simulationAssignments.reduce((acc, a) => {
    const tareaId = String(a.tarea?._id || a.tarea);
    acc[tareaId] = a;
    return acc;
  }, {});

  const tasksDetalle = tasks.map((task) => {
    const taskId = String(task._id);
    const expected = expectedByTask[taskId];
    const log = logsByTask[taskId];
    const sesiones = sessionsByTask[taskId] || [];

    const horasReales = sesiones.reduce((sum, s) => sum + safeNumber(s.tiempoTrabajadoHoras), 0);
    const devId = String(task.desarrolladorAsignado || expected?.desarrollador || "");
    const costoHora = safeNumber(userMap.get(devId)?.costoPorHora);
    const costoReal = horasReales * costoHora;

    let rendimiento = 0;
    if (log) {
      const est = safeNumber(log.duracionEstimadaHoras);
      const inv = safeNumber(log.tiempoInvertidoHoras);
      if (est > 0 && inv > 0) {
        rendimiento = (est / inv) * 100;
      }
    }

    return {
      tareaId: task._id,
      descripcion: task.descripcion || "",
      expected: {
        horasTotales: safeNumber(expected?.horasTotales),
        costoTotal: safeNumber(expected?.costoTotal),
        horasEstimadasReales: safeNumber(expected?.horasEstimadasReales),
        puntuacionCalidad: safeNumber(expected?.puntuacionCalidad),
        feedbackHistorico: safeNumber(expected?.feedbackHistorico),
      },
      real: {
        tiempoInvertidoHoras: Number(horasReales.toFixed(2)),
        costoTotal: Number(costoReal.toFixed(2)),
        estado: task.estado || "",
        puntuacionCalidad: safeNumber(log?.puntuacionCalidad),
        rendimiento: Number(rendimiento.toFixed(2)),
      },
    };
  });

  const tiempoEstimadoReal = tasks.reduce(
    (sum, t) => sum + safeNumber(t.tiempoEstimadoHoras),
    0
  );

  const calidadPromedioReal = avg(sumQuality, countQuality);
  const rendimientoPromedioReal = avg(sumRend, countRend);

  const payload = {
    proyecto: projectId,
    fechaInicio: startDate,
    fechaFin: endDate,
    expected: {
      tiempoTotalEstimado: safeNumber(simulation.tiempoTotalEstimado),
      tiempoTotalSimulado: safeNumber(simulation.tiempoTotalSimulado),
      calidadPromedioTareas: safeNumber(simulation.calidadPromedioTareas),
      calidadPromedioSimulado: safeNumber(simulation.calidadPromedioSimulado),
      costoTotalSimulado: safeNumber(simulation.costoTotalSimulado),
    },
    real: {
      tiempoTotalEstimado: Number(tiempoEstimadoReal.toFixed(2)),
      tiempoTotalSimulado: Number(realHoursProject.toFixed(2)),
      calidadPromedioTareas: calidadPromedioReal,
      calidadPromedioSimulado: calidadPromedioReal,
      costoTotalSimulado: Number(realCostProject.toFixed(2)),
    },
    tareas: {
      total: tasks.length,
      completadas: tareasCompletadas,
      retrasadas: tareasRetrasadas,
      canceladas: tareasCanceladas,
    },
    tareasDetalle: tasksDetalle,
    desarrolladores: developers,
  };

  return await createFinalProjectReport(payload);
}
