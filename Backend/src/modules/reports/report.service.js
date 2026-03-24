import SesionTrabajo from "../task/sesionTrabajo.js";
import TaskLog from "../task/taskLog.model.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import Project from "../projects/project.model.js";
import { createFinalProjectReport, findLatestSimulationByProject, findFinalReportByProject } from "./report.dao.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import PerformanceFeedback from "../performanceFeedback/performanceFeedback.model.js";

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function avg(sum, count) {
  if (!count) return 0;
  return Number((sum / count).toFixed(2));
}

function toBestTimeUnit(hoursValue) {
  const hours = safeNumber(hoursValue);
  if (hours < 1 / 60) {
    return { valor: Number((hours * 3600).toFixed(2)), unidad: "segundos" };
  }
  if (hours < 1) {
    return { valor: Number((hours * 60).toFixed(2)), unidad: "minutos" };
  }
  return { valor: Number(hours.toFixed(2)), unidad: "horas" };
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
    .select("nombre apellido costoPorHora rendimientoHistorico puntuacionPromedioCalidad feedbackHistorico")
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

  const existingReport = await findFinalReportByProject(projectId);
  if (existingReport) {
    throw new Error("Ya existe un resumen global para este proyecto");
  }

  const project = await Project.findById(projectId).lean();
  if (!project) throw new Error("Proyecto no encontrado");

  if (project.estado !== "finalizado") {
    throw new Error("El proyecto debe estar finalizado para generar el resumen global");
  }

  const startDate = project.fechaInicioReal;
  const endDate = project.fechaFinReal;

  if (!startDate || !endDate) {
    throw new Error("El proyecto no tiene fechas de inicio o fin válidas");
  }

  const [tasks, taskLogs, sessions, simulation, performanceFeedbacks, adminUser] = await Promise.all([
    Task.find({ proyecto: projectId }).lean(),
    TaskLog.find({ proyecto: projectId }).lean(),
    SesionTrabajo.find({ proyectoId: projectId, estado: "cerrada" }).lean(),
    findLatestSimulationByProject(projectId),
    PerformanceFeedback.find({ proyecto: projectId }).lean(),
    project.administrador ? User.findById(project.administrador).select("nombre apellido").lean() : null,
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
    .select("nombre apellido costoPorHora rendimientoHistorico puntuacionPromedioCalidad feedbackHistorico")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let realHoursProject = 0;
  let realCostProject = 0;

  let sumQuality = 0;
  let countQuality = 0;

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

    if (log.estado !== "cancelada") {
      metric.tareasCompletadas += 1;
    }
  }

  const taskIdsWithQuality = new Set(
    taskLogs
      .filter((log) => log.puntuacionCalidad != null)
      .map((log) => String(log.tarea))
  );

  const tareasSinCalificar = tasks.filter(
    (task) => !taskIdsWithQuality.has(String(task._id))
  );

  if (tareasSinCalificar.length > 0) {
    throw new Error("No se puede generar el resumen: faltan calificaciones de tareas");
  }

  if (countQuality === 0) {
    throw new Error("No se puede generar el resumen: faltan calificaciones de tareas");
  }

  if (project.puntajeCalidad == null) {
    throw new Error("No se puede generar el resumen: falta puntaje de calidad del proyecto");
  }

  const feedbackByDev = performanceFeedbacks.reduce((acc, f) => {
    const devId = String(f.desarrollador);
    if (!acc[devId]) acc[devId] = { sum: 0, count: 0 };
    acc[devId].sum += safeNumber(f.puntuacion);
    acc[devId].count += 1;
    return acc;
  }, {});

  const developers = Array.from(devMetrics.values()).map((metric) => {
    const user = userMap.get(metric.desarrolladorId);
    const rendimiento = safeNumber(user?.rendimientoHistorico?.promedioPorcentaje);
    const calidadTareasEsperada = safeNumber(user?.puntuacionPromedioCalidad?.puntuacionPromedio);
    const calidadProyectoEsperada = safeNumber(user?.feedbackHistorico?.puntuacionPromedio);
    const feedback = feedbackByDev[String(metric.desarrolladorId)] || { sum: 0, count: 0 };
    const calidadProyecto = feedback.count > 0 ? feedback.sum / feedback.count : 0;

    metric.expectedHours = toBestTimeUnit(metric.expectedHours);
    metric.realHours = toBestTimeUnit(metric.realHours);
    metric.expectedCost = Number(metric.expectedCost.toFixed(2));
    metric.realCost = Number(metric.realCost.toFixed(2));
    metric.calidadTareas = avg(metric._sumCalidad, metric._countCalidad);
    metric.calidadProyecto = Number(calidadProyecto.toFixed(2));
    metric.calidadTareasEsperada = Number(calidadTareasEsperada.toFixed(2));
    metric.calidadProyectoEsperada = Number(calidadProyectoEsperada.toFixed(2));
    metric.promedioRendimiento = Number(rendimiento.toFixed(2));
    delete metric._sumCalidad;
    delete metric._countCalidad;

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

    const calidadTareaReal = safeNumber(
      userMap.get(devId)?.puntuacionPromedioCalidad?.puntuacionPromedio
    );

    const devName = userMap.get(devId)
      ? `${userMap.get(devId).nombre || ""} ${userMap.get(devId).apellido || ""}`.trim()
      : "";

    return {
      tareaId: task._id,
      descripcion: task.descripcion || "",
      categoria: task.categoria || "",
      nivelDificultad: safeNumber(task.nivelDificultad),
      prioridad: task.prioridad || "",
      desarrolladorAsignadoNombre: devName,
      expected: {
        horasTotales: safeNumber(expected?.horasTotales),
        costoTotal: safeNumber(expected?.costoTotal),
        horasEstimadasReales: safeNumber(expected?.horasEstimadasReales),
        puntuacionCalidad: safeNumber(expected?.puntuacionCalidad),
      },
      real: {
        tiempoInvertido: toBestTimeUnit(horasReales),
        costoTotalReal: Number(costoReal.toFixed(2)),
        estado: task.estado || "",
        calidadTareaReal: Number(calidadTareaReal.toFixed(2)),
      },
    };
  });

  const calidadPromedioReal = avg(sumQuality, countQuality);

  const nombreAdministrador = adminUser
    ? `${adminUser.nombre || ""} ${adminUser.apellido || ""}`.trim()
    : "";

  const payload = {
    proyecto: projectId,
    nombreProyecto: project.nombre || "",
    descripcionProyecto: project.descripcion || "",
    fechaInicioEstimada: project.fechaInicioEstimada || null,
    fechaFinEstimada: project.fechaFinEstimada || null,
    fechaCreacion: project.fechaCreacion || null,
    nivelDificultad: safeNumber(project.nivelDificultad),
    prioridad: project.prioridad || "",
    nombreAdministrador,
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
      tiempoTotalReal: toBestTimeUnit(realHoursProject),
      calidadPromedioTareasReal: calidadPromedioReal,
      calidadPromedioProyectoReal: safeNumber(project.puntajeCalidad),
      costoTotalReal: Number(realCostProject.toFixed(2)),
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

export async function getFinalProjectReport(projectId) {
  if (!projectId) throw new Error("projectId es requerido");

  const report = await findFinalReportByProject(projectId);
  if (!report) throw new Error("No se encontró resumen final para este proyecto");

  return report;
}

function buildFinalReportPdf(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        layout: "landscape",
        margin: 40,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const colors = {
        title: "#1F2937",
        subtitle: "#374151",
        line: "#D1D5DB",
        headerFill: "#F3F4F6",
        border: "#D1D5DB",
        text: "#111827",
        muted: "#6B7280",
      };

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      const pageBottom = () => doc.page.height - doc.page.margins.bottom;

      const formatDate = (value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("es-AR");
      };

      const formatNumber = (value, decimals = 2) => {
        const num = Number(value ?? 0);
        if (Number.isNaN(num)) return "0.00";
        return num.toFixed(decimals);
      };

      const formatInteger = (value) => {
        const num = Number(value ?? 0);
        if (Number.isNaN(num)) return "0";
        return String(Math.round(num));
      };

      const safeText = (value) => {
        if (value === null || value === undefined || value === "") return "-";
        return String(value);
      };

      const projectLabel = report.nombreProyecto
        ? report.nombreProyecto
        : typeof report.proyecto === "object"
          ? report.proyecto?.nombre || report.proyecto?._id?.toString?.() || "-"
          : report.proyecto?.toString?.() || "-";

      const ensureSpace = (neededHeight = 40) => {
        if (doc.y + neededHeight > pageBottom()) {
          doc.addPage();
          doc.y = doc.page.margins.top;
        }
      };

      const sectionTitle = (text, spaceAfter = 8) => {
        ensureSpace(40);
        doc.moveDown(0.4);
        doc.fillColor(colors.title).font("Helvetica-Bold").fontSize(13);
        doc.text(text, doc.page.margins.left, doc.y, { align: "left" });
        doc.moveDown(0.2);
        doc.fillColor(colors.text).font("Helvetica").fontSize(10);
        doc.y += spaceAfter;
      };

      const drawTable = ({
        headers,
        rows,
        columnWidths,
        minRowHeight = 24,
        minRowsAfterHeader = 1,
      }) => {
        const startX = doc.page.margins.left;
        const usableWidth = pageWidth;
        const totalDeclaredWidth = columnWidths.reduce((sum, w) => sum + w, 0);

        const normalizedWidths = columnWidths.map(
          (w) => (w / totalDeclaredWidth) * usableWidth
        );

        const getHeaderHeight = () => {
          doc.font("Helvetica-Bold").fontSize(10);
          const heights = headers.map((header, idx) =>
            doc.heightOfString(String(header), {
              width: normalizedWidths[idx] - 12,
              align: "left",
            })
          );
          return Math.max(minRowHeight, Math.max(...heights) + 12);
        };

        const getRowHeight = (row) => {
          doc.font("Helvetica").fontSize(9);
          const heights = row.map((cell, idx) =>
            doc.heightOfString(safeText(cell), {
              width: normalizedWidths[idx] - 12,
              align: "left",
            })
          );
          return Math.max(minRowHeight, Math.max(...heights) + 12);
        };

        const drawHeader = (y, headerHeight) => {
          let x = startX;

          doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.title);

          headers.forEach((header, idx) => {
            const width = normalizedWidths[idx];

            doc
              .rect(x, y, width, headerHeight)
              .fillAndStroke(colors.headerFill, colors.border);

            doc.fillColor(colors.title).text(String(header), x + 6, y + 6, {
              width: width - 12,
              align: "left",
            });

            x += width;
          });

          doc.font("Helvetica").fontSize(9).fillColor(colors.text);
          return y + headerHeight;
        };

        const headerHeight = getHeaderHeight();
        const firstRowHeight =
          rows.length > 0 ? getRowHeight(rows[0]) : minRowHeight;

        ensureSpace(
          headerHeight + firstRowHeight * Math.max(minRowsAfterHeader, 1) + 10
        );

        let y = doc.y;
        y = drawHeader(y, headerHeight);

        for (const row of rows) {
          const rowHeight = getRowHeight(row);

          if (y + rowHeight > pageBottom()) {
            doc.addPage();
            doc.y = doc.page.margins.top;
            y = drawHeader(doc.y, headerHeight);
          }

          let x = startX;

          row.forEach((cell, idx) => {
            const width = normalizedWidths[idx];
            const text = safeText(cell);

            doc.rect(x, y, width, rowHeight).stroke(colors.border);

            doc.fillColor(colors.text).text(text, x + 6, y + 6, {
              width: width - 12,
              align: "left",
            });

            x += width;
          });

          y += rowHeight;
        }

        doc.y = y + 10;
      };

      // HEADER
      doc.fillColor(colors.title).font("Helvetica-Bold").fontSize(20);
      doc.text("Resumen final del proyecto", 40, 38, { align: "left" });

      doc.fillColor(colors.subtitle).font("Helvetica").fontSize(10);
      doc.text(`Proyecto: ${projectLabel}`, 40, 68);
      doc.text(`Administrador: ${safeText(report.nombreAdministrador)}`, 40, 84);

      doc
        .moveTo(doc.page.margins.left, 104)
        .lineTo(doc.page.width - doc.page.margins.right, 104)
        .strokeColor(colors.line)
        .stroke();

      doc.y = 118;

      // DATOS DEL PROYECTO
      sectionTitle("Datos del proyecto");
      drawTable({
        headers: ["Campo", "Valor"],
        columnWidths: [35, 65],
        rows: [
          ["Descripcion", safeText(report.descripcionProyecto)],
          ["Fecha creacion", formatDate(report.fechaCreacion)],
          ["Fecha inicio estimada", formatDate(report.fechaInicioEstimada)],
          ["Fecha fin estimada", formatDate(report.fechaFinEstimada)],
          ["Fecha inicio real", formatDate(report.fechaInicio)],
          ["Fecha fin real", formatDate(report.fechaFin)],
          ["Nivel dificultad", formatInteger(report.nivelDificultad)],
          ["Prioridad", safeText(report.prioridad)],
        ],
      });

      // RESUMEN
      sectionTitle("Resumen esperado vs real");
      drawTable({
        headers: ["Métrica", "Esperado", "Real"],
        columnWidths: [34, 33, 33],
        rows: [
          [
            "Tiempo total estimado",
            formatNumber(report.expected?.tiempoTotalEstimado),
            report.real?.tiempoTotalReal
              ? `${report.real.tiempoTotalReal.valor} ${report.real.tiempoTotalReal.unidad}`
              : "-",
          ],
          [
            "Tiempo total simulado",
            formatNumber(report.expected?.tiempoTotalSimulado),
            report.real?.tiempoTotalReal
              ? `${report.real.tiempoTotalReal.valor} ${report.real.tiempoTotalReal.unidad}`
              : "-",
          ],
          [
            "Calidad promedio tareas",
            formatNumber(report.expected?.calidadPromedioTareas),
            formatNumber(report.real?.calidadPromedioTareasReal),
          ],
          [
            "Calidad promedio proyecto",
            formatNumber(report.expected?.calidadPromedioSimulado),
            formatNumber(report.real?.calidadPromedioProyectoReal),
          ],
          [
            "Costo total simulado",
            formatNumber(report.expected?.costoTotalSimulado),
            formatNumber(report.real?.costoTotalReal),
          ],
        ],
      });

      // TAREAS
      sectionTitle("Estado de tareas");
      drawTable({
        headers: ["Total", "Completadas", "Retrasadas", "Canceladas"],
        columnWidths: [25, 25, 25, 25],
        rows: [[
          formatInteger(report.tareas?.total),
          formatInteger(report.tareas?.completadas),
          formatInteger(report.tareas?.retrasadas),
          formatInteger(report.tareas?.canceladas),
        ]],
      });

      // DESARROLLADORES
      sectionTitle("Desarrolladores");
      const devs = Array.isArray(report.desarrolladores) ? report.desarrolladores : [];
      if (devs.length === 0) {
        doc.fillColor(colors.muted).text("Sin datos de desarrolladores.");
      } else {
        drawTable({
          headers: [
            "Desarrollador",
            "Horas esperadas",
            "Horas reales",
            "Costo esperado",
            "Costo real",
            "Tareas comp.",
            "Tareas retr.",
            "Calidad tareas",
            "Calidad proyecto",
            "Calidad tareas esp.",
            "Calidad proyecto esp.",
            "Rendimiento",
          ],
          columnWidths: [18, 8, 8, 8, 8, 7, 7, 8, 8, 8, 8, 7],
          rows: devs.map((dev) => [
            `${dev.nombre || ""} ${dev.apellido || ""}`.trim() || "Sin nombre",
            dev.expectedHours
              ? `${dev.expectedHours.valor} ${dev.expectedHours.unidad}`
              : "-",
            dev.realHours
              ? `${dev.realHours.valor} ${dev.realHours.unidad}`
              : "-",
            formatNumber(dev.expectedCost),
            formatNumber(dev.realCost),
            formatInteger(dev.tareasCompletadas),
            formatInteger(dev.tareasRetrasadas),
            formatNumber(dev.calidadTareas),
            formatNumber(dev.calidadProyecto),
            formatNumber(dev.calidadTareasEsperada),
            formatNumber(dev.calidadProyectoEsperada),
            formatNumber(dev.promedioRendimiento),
          ]),
        });
      }

      // DETALLE TAREAS
      const tareasDetalle = Array.isArray(report.tareasDetalle) ? report.tareasDetalle : [];
      if (tareasDetalle.length > 0) {
        ensureSpace(80);
      }
      sectionTitle("Detalle por tarea");

      if (tareasDetalle.length === 0) {
        doc.fillColor(colors.muted).text("Sin detalle de tareas.");
      } else {
        drawTable({
          headers: [
            "Tarea",
            "Desarrollador",
            "Categoria",
            "Prioridad",
            "Dificultad",
            "Horas esperadas",
            "Horas est. reales",
            "Tiempo real",
            "Costo esperado",
            "Costo real",
            "Estado",
            "Calidad esperada",
            "Calidad tarea real",
          ],
          columnWidths: [16, 12, 8, 7, 7, 7, 8, 8, 8, 7, 7, 7, 8],
          rows: tareasDetalle.map((tarea) => [
            tarea.descripcion || "(sin descripción)",
            tarea.desarrolladorAsignadoNombre || "-",
            tarea.categoria || "-",
            tarea.prioridad || "-",
            formatInteger(tarea.nivelDificultad),
            formatNumber(tarea.expected?.horasTotales),
            formatNumber(tarea.expected?.horasEstimadasReales),
            tarea.real?.tiempoInvertido
              ? `${tarea.real.tiempoInvertido.valor} ${tarea.real.tiempoInvertido.unidad}`
              : "-",
            formatNumber(tarea.expected?.costoTotal),
            formatNumber(tarea.real?.costoTotalReal),
            safeText(tarea.real?.estado),
            formatNumber(tarea.expected?.puntuacionCalidad),
            formatNumber(tarea.real?.calidadTareaReal),
          ]),
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function getFinalProjectReportPdf(projectId) {
  const report = await getFinalProjectReport(projectId);
  return await buildFinalReportPdf(report);
}
