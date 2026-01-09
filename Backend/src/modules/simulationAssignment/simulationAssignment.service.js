import Task from "../task/task.model.js";      // ajustá ruta real
import User from "../users/user.model.js";      // ajustá ruta real
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js"; // ajustá ruta real
import { asignarTareaManual } from "../assignment/assignment.service.js"; // ajustá ruta real

/**
 * Calcula los datos globales de una simulación a partir del resultado de la IA
 */
export const calcularDatosGlobalesSimulacion = (resultadoIACompleto) => {
  const { projectId, asignaciones } = resultadoIACompleto;

  if (!projectId) throw new Error("Falta projectId en el resultado de la IA");
  if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
    throw new Error("No hay asignaciones en el resultado de la IA");
  }

  const criterio = asignaciones[0]?.tipoAsignacion || "basica";

  let tiempoTotalEstimado = 0;
  let tiempoTotalSimulado = 0;
  let sumaCalidadTareas = 0;
  let sumaCalidadSimulada = 0;
  let contadorCalidadTareas = 0;
  let contadorCalidadSimulada = 0;
  let costoTotalSimulado = 0;

  for (const a of asignaciones) {
    tiempoTotalEstimado += Number(a.horasTotales) || 0;

    if (a.horasEstimadasSegunRendimiento != null) {
      tiempoTotalSimulado += Number(a.horasEstimadasSegunRendimiento) || 0;
    } else if (a.horasTotales != null) {
      tiempoTotalSimulado += Number(a.horasTotales) || 0;
    }

    if (a.calidadTarea != null) {
      sumaCalidadTareas += Number(a.calidadTarea) || 0;
      contadorCalidadTareas++;
    }

    if (a.feedbackHistorico != null) {
      sumaCalidadSimulada += Number(a.feedbackHistorico) || 0;
      contadorCalidadSimulada++;
    }

    if (a.costoTotal != null) {
      costoTotalSimulado += Number(a.costoTotal) || 0;
    }
  }

  const calidadPromedioTareas =
    contadorCalidadTareas > 0
      ? Number((sumaCalidadTareas / contadorCalidadTareas).toFixed(2))
      : 0;

  const calidadPromedioSimulado =
    contadorCalidadSimulada > 0
      ? Number((sumaCalidadSimulada / contadorCalidadSimulada).toFixed(2))
      : 0;

  return {
    proyecto: projectId,
    criterio,
    tiempoTotalEstimado: Number(tiempoTotalEstimado.toFixed(2)),
    tiempoTotalSimulado: Number(tiempoTotalSimulado.toFixed(2)),
    calidadPromedioTareas,
    calidadPromedioSimulado,
    costoTotalSimulado: Number(costoTotalSimulado.toFixed(2)),
  };
};

// ---- PREVIEW INCOMPLETO (4 JSON) ----
import { previsualizarAsignacionBasica } from "../criteria/index.js";
import { previsualizarAsignacionPorCosto } from "../criteria/costo.js";
import { previewObtenerAsignacionesPorTiempoIA } from "../criteria/tiempo.js";
import { previewObtenerAsignacionesPorCalidadIA } from "../criteria/calidad.js";

export const obtenerPreviewResumenService = async (projectId) => {
  if (!projectId) throw new Error("projectId es requerido");

  const [jsonBasica, jsonCosto, jsonTiempoIA, jsonCalidad] = await Promise.all([
    previsualizarAsignacionBasica(projectId),
    previsualizarAsignacionPorCosto(projectId),
    previewObtenerAsignacionesPorTiempoIA(projectId),
    previewObtenerAsignacionesPorCalidadIA(projectId),
  ]);

  return {
    basica: jsonBasica,
    costo: jsonCosto,
    tiempoIA: jsonTiempoIA,
    calidad: jsonCalidad,
  };
};

// src/modules/simulationAssignment/simulationAssignment.manualAccum.service.js
// ESM

// Helpers
function toISODateKey(date) {
  // Normaliza a YYYY-MM-DD para mapear por día
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function sumHorasDisponibles(dias) {
  let total = 0;
  for (const dia of dias) {
    const h = Number(dia.horasDisponibles ?? dia.horas ?? 0) || 0;
    total += h;
  }
  return total;
}

/**
 * Distribuye horas "lo más uniforme posible" sobre los días disponibles,
 * respetando el saldo restante por día. Devuelve { ok, dias, horasRestantes }.
 */
function distribuirHorasEnDias({ diasDisponibles, horasNecesarias, saldoPorFecha }) {
  let horasRestantes = Number(horasNecesarias) || 0;
  if (horasRestantes <= 0) {
    return { ok: true, dias: [], horasRestantes: 0 };
  }

  // Filtrar días que tengan saldo > 0
  const fechas = diasDisponibles
    .map(d => toISODateKey(d.fecha))
    .filter(f => (Number(saldoPorFecha.get(f)) || 0) > 0);

  if (fechas.length === 0) {
    return { ok: false, dias: [], horasRestantes };
  }

  const plan = [];

  // Estrategia: repartir en “rondas” 1h por día (round-robin) para uniformidad,
  // y en cada día asignar hasta agotar saldo o horasRestantes.
  // Si querés granularidad de 0.5h, cambiá paso=0.5
  const paso = 1;

  while (horasRestantes > 0) {
    let asignoAlgoEnLaRonda = false;

    for (const f of fechas) {
      if (horasRestantes <= 0) break;

      const saldo = Number(saldoPorFecha.get(f)) || 0;
      if (saldo <= 0) continue;

      const asignar = Math.min(paso, saldo, horasRestantes);
      if (asignar <= 0) continue;

      // acumular en el plan
      const existente = plan.find(x => x.fechaKey === f);
      if (existente) {
        existente.horasAsignadas += asignar;
      } else {
        plan.push({ fechaKey: f, horasAsignadas: asignar });
      }

      // descontar del saldo
      saldoPorFecha.set(f, saldo - asignar);

      horasRestantes -= asignar;
      asignoAlgoEnLaRonda = true;
    }

    // si no se pudo asignar nada en toda la ronda, se corta (no hay más saldo)
    if (!asignoAlgoEnLaRonda) break;
  }

  if (horasRestantes > 0) {
    // rollback: devolvemos el saldo al estado anterior (importante)
    for (const p of plan) {
      const saldoActual = Number(saldoPorFecha.get(p.fechaKey)) || 0;
      saldoPorFecha.set(p.fechaKey, saldoActual + p.horasAsignadas);
    }
    return { ok: false, dias: [], horasRestantes };
  }

  // Convertir a formato requerido: fecha ISO con T00:00:00.000Z
  const dias = plan
    .sort((a, b) => a.fechaKey.localeCompare(b.fechaKey))
    .map(p => ({
      fecha: new Date(`${p.fechaKey}T00:00:00.000Z`).toISOString(),
      horasAsignadas: Number(p.horasAsignadas.toFixed(2)),
    }));

  return { ok: true, dias, horasRestantes: 0 };
}

/**
 * Verifica disponibilidad acumulada (reserva horas) para asignaciones manuales.
 * Recibe:
 * {
 *   "asignaciones-manuales": [
 *      { tareaId, desarrolladorId }, ...
 *   ]
 * }
 */

export async function verificarDisponibilidadAcumuladaAsignacionesManualesService(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Body inválido. Se esperaba un objeto.");
  }

  const asignacionesManuales = payload["asignaciones-manuales"];
  if (!Array.isArray(asignacionesManuales) || asignacionesManuales.length === 0) {
    throw new Error('Falta "asignaciones-manuales" o está vacío (debe ser un array).');
  }

  const tareaIds = [...new Set(asignacionesManuales.map(a => a?.tareaId).filter(Boolean))];
  const devIds = [...new Set(asignacionesManuales.map(a => a?.desarrolladorId).filter(Boolean))];

  const [tareas, devs] = await Promise.all([
    Task.find({ _id: { $in: tareaIds } }),
    User.find({ _id: { $in: devIds } }),
  ]);

  const tareasById = new Map(tareas.map(t => [String(t._id), t]));
  const devsById = new Map(devs.map(d => [String(d._id), d]));

  // Saldo por dev: Map<devId, Map<fechaKey, horasRestantes>>
  const saldoPorDev = new Map();

  const resultados = [];
  const errores = [];

  for (const item of asignacionesManuales) {
    const tareaId = item?.tareaId;
    const desarrolladorId = item?.desarrolladorId;

    if (!tareaId || !desarrolladorId) {
      const msg = `Item inválido: tareaId y desarrolladorId son requeridos. Recibido: ${JSON.stringify(item)}`;
      errores.push(msg);
      resultados.push({ tareaId: tareaId ?? null, desarrolladorId: desarrolladorId ?? null, disponible: false, motivo: msg });
      continue;
    }

    const tarea = tareasById.get(String(tareaId));
    const dev = devsById.get(String(desarrolladorId));

    if (!tarea) {
      const msg = `Tarea no encontrada: ${tareaId}`;
      errores.push(msg);
      resultados.push({ tareaId, desarrolladorId, disponible: false, motivo: msg });
      continue;
    }
    if (!dev) {
      const msg = `Desarrollador no encontrado: ${desarrolladorId}`;
      errores.push(msg);
      resultados.push({ tareaId, desarrolladorId, disponible: false, motivo: msg });
      continue;
    }

   

    // 👇 Ajustá si tus campos se llaman distinto
    const fechaInicio = tarea.fechaEstimadaInicio;
    const fechaFin = tarea.fechaEstimadaFin;
    const horasNecesarias = tarea.tiempoEstimadoHoras;

    if (!fechaInicio || !fechaFin || horasNecesarias == null) {
      const msg = `La tarea ${tareaId} no tiene fechaEstimadaInicio/fechaEstimadaFin/tiempoEstimadoHoras válidos`;
      errores.push(msg);
      resultados.push({ tareaId, desarrolladorId, disponible: false, motivo: msg });
      continue;
    }

    // Inicializar saldo del dev si no existe
    if (!saldoPorDev.has(String(desarrolladorId))) {
      saldoPorDev.set(String(desarrolladorId), new Map());
    }
    const saldoPorFecha = saldoPorDev.get(String(desarrolladorId));

    // Traer disponibilidad "base" del dev en el rango de la tarea
    const diasDisponiblesBase = obtenerDisponibilidadEnRango(dev, fechaInicio, fechaFin);
    // Cargar saldo inicial en el mapa (solo si aún no estaba cargado esa fecha)
    for (const d of diasDisponiblesBase) {
      const f = toISODateKey(d.fecha);
      if (!saldoPorFecha.has(f)) {
        const h = Number(d.horasDisponibles ?? d.horas ?? 0) || 0;
        saldoPorFecha.set(f, h);
      }
    }

    // Verificación rápida de total restante en el rango
    const totalRestante = sumHorasDisponibles(
      diasDisponiblesBase.map(d => ({ fecha: d.fecha, horasDisponibles: saldoPorFecha.get(toISODateKey(d.fecha)) || 0 }))
    );

    if (totalRestante < Number(horasNecesarias)) {
      const msg = `No disponible (acumulado): horas restantes insuficientes en el rango. Necesita=${horasNecesarias}, restante=${totalRestante}`;
      errores.push(`tarea ${tareaId} -> dev ${desarrolladorId}: ${msg}`);
      resultados.push({
        tareaId,
        desarrolladorId,
        disponible: false,
        motivo: msg,
        detalle: { fechaInicio, fechaFin, horasNecesarias, totalRestante },
      });
      continue;
    }

    // Distribuir y “reservar” horas por día
    const { ok, dias } = distribuirHorasEnDias({
      diasDisponibles: diasDisponiblesBase,
      horasNecesarias,
      saldoPorFecha,
    });

    if (!ok) {
      const msg = "No disponible (acumulado): no se pudo distribuir las horas sin sobreasignar días.";
      errores.push(`tarea ${tareaId} -> dev ${desarrolladorId}: ${msg}`);
      resultados.push({
        tareaId,
        desarrolladorId,
        disponible: false,
        motivo: msg,
        detalle: { fechaInicio, fechaFin, horasNecesarias },
      });
      continue;
    }

    resultados.push({
      tareaId,
      desarrolladorId,
      disponible: true,
      motivo: "OK: disponibilidad acumulada válida. Horas reservadas.",
      dias, // ✅ distribución sugerida (ya reservada en saldo)
      detalle: { fechaInicio, fechaFin, horasNecesarias },
    });
  }

  return {
    ok: errores.length === 0,
    total: asignacionesManuales.length,
    validas: resultados.filter(r => r.disponible).length,
    invalidas: resultados.filter(r => !r.disponible).length,
    resultados,
    errores,
  };
}



const CRITERIOS = ["basica", "costo", "tiempoIA", "calidad"];

function esNoAsignada(t) {
  const devId = t?.desarrolladorId;
  const tieneDev = devId !== null && devId !== undefined && String(devId).trim() !== "";
  return Boolean(t?.sinCandidatos) || !tieneDev;
}

function normalizarTipoAsignacionPorCriterio(key) {
  if (key === "tiempoIA") return "tiempo";
  return key; // basica | costo | calidad
}

function buildAsignacionParaManualDesdeBasica(tareaBasica, desarrolladorId) {
  const fechaEstimadaInicio = tareaBasica.fechaEstimadaInicio;
  const fechaEstimadaFin = tareaBasica.fechaEstimadaFin;

  const estimacionHoras =
    tareaBasica.estimacionHoras ??
    tareaBasica.tiempoEstimadoHoras ??
    tareaBasica.horasTotales;

  return {
    tareaId: tareaBasica.tareaId,
    desarrolladorId,
    descripcion: tareaBasica.descripcion,

    fechaEstimadaInicio,
    fechaEstimadaFin,
    estimacionHoras,

    // el service luego lo clona por criterio, pero esta base puede ser "manual"
    tipoAsignacion: "manual",
    prioridad: tareaBasica.prioridad,
    habilidadesRequeridas: tareaBasica.habilidadesRequeridas,
  };
}

export async function aplicarAsignacionesManualesService(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Body inválido. Se esperaba un objeto.");
  }

  const manuales = payload["asignaciones-manuales"];
  if (!Array.isArray(manuales) || manuales.length === 0) {
    throw new Error('Falta "asignaciones-manuales" o está vacío.');
  }

  if (!payload.basica || !Array.isArray(payload.basica.asignaciones)) {
    throw new Error('Falta el criterio "basica" con su array de asignaciones.');
  }

  // Copia del objeto para no mutar req.body
  const resultado = { ...payload };

  for (const m of manuales) {
    const tareaId = m?.tareaId;
    const desarrolladorId = m?.desarrolladorId;

    if (!tareaId || !desarrolladorId) {
      throw new Error(
        `Asignación manual inválida: se requiere tareaId y desarrolladorId. Recibido: ${JSON.stringify(m)}`
      );
    }

    // 1) Buscar la tarea SOLO en BASICA (fuente de datos completos)
    const idxBasica = resultado.basica.asignaciones.findIndex(
      (t) => String(t?.tareaId) === String(tareaId)
    );

    if (idxBasica === -1) {
      throw new Error(`La tarea ${tareaId} no existe en el criterio basica.`);
    }

    const tareaBasica = resultado.basica.asignaciones[idxBasica];

    if (!esNoAsignada(tareaBasica)) {
      throw new Error(`La tarea ${tareaId} en basica ya está asignada. No se aplica manual.`);
    }

    if (!tareaBasica.fechaEstimadaInicio || !tareaBasica.fechaEstimadaFin) {
      throw new Error(
        `La tarea ${tareaId} no tiene fechaEstimadaInicio/fechaEstimadaFin en basica.`
      );
    }

    const asignacionParaManual = buildAsignacionParaManualDesdeBasica(tareaBasica, desarrolladorId);

    if (!asignacionParaManual.estimacionHoras || Number(asignacionParaManual.estimacionHoras) <= 0) {
      throw new Error(`La tarea ${tareaId} no tiene estimacionHoras válida en basica.`);
    }

    // 2) Llamar UNA sola vez a asignarTareaManual
    const baseCorregida = await asignarTareaManual(asignacionParaManual);

    // 3) Reemplazar en TODOS los criterios (si existe allí)
    for (const criterioKey of CRITERIOS) {
      const crit = resultado[criterioKey];
      if (!crit || !Array.isArray(crit.asignaciones)) continue;

      const idx = crit.asignaciones.findIndex((t) => String(t?.tareaId) === String(tareaId));
      if (idx === -1) continue;

      // Clonar y setear tipoAsignacion correcto por criterio
      crit.asignaciones[idx] = {
        ...baseCorregida,
        tipoAsignacion: normalizarTipoAsignacionPorCriterio(criterioKey),
      };
    }
  }

  // 4) Remover bloque manual del response final
  delete resultado["asignaciones-manuales"];

  

  return resultado;
}

export const calcularDatosGlobalesSimulacionPorCriterio = (resultadoCompleto) => {
  if (!resultadoCompleto || typeof resultadoCompleto !== "object") {
    throw new Error("Resultado inválido. Se esperaba un objeto con criterios.");
  }

  const CRITERIOS = ["basica", "costo", "tiempoIA", "calidad"];

  // helper: calcula globales para 1 criterio (igual a tu función original)
  const calcularUno = (resultadoIACompleto) => {
    const { projectId, asignaciones } = resultadoIACompleto || {};

    if (!projectId) throw new Error("Falta projectId en un criterio del resultado");
    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      throw new Error("No hay asignaciones en un criterio del resultado");
    }

    const criterio = asignaciones[0]?.tipoAsignacion || "basica";

    let tiempoTotalEstimado = 0;
    let tiempoTotalSimulado = 0;
    let sumaCalidadTareas = 0;
    let sumaCalidadSimulada = 0;
    let contadorCalidadTareas = 0;
    let contadorCalidadSimulada = 0;
    let costoTotalSimulado = 0;

    for (const a of asignaciones) {
      tiempoTotalEstimado += Number(a.horasTotales) || 0;

      if (a.horasEstimadasSegunRendimiento != null) {
        tiempoTotalSimulado += Number(a.horasEstimadasSegunRendimiento) || 0;
      } else if (a.horasTotales != null) {
        tiempoTotalSimulado += Number(a.horasTotales) || 0;
      }

      if (a.calidadTarea != null) {
        sumaCalidadTareas += Number(a.calidadTarea) || 0;
        contadorCalidadTareas++;
      }

      if (a.feedbackHistorico != null) {
        sumaCalidadSimulada += Number(a.feedbackHistorico) || 0;
        contadorCalidadSimulada++;
      }

      if (a.costoTotal != null) {
        costoTotalSimulado += Number(a.costoTotal) || 0;
      }
    }

    const calidadPromedioTareas =
      contadorCalidadTareas > 0
        ? Number((sumaCalidadTareas / contadorCalidadTareas).toFixed(2))
        : 0;

    const calidadPromedioSimulado =
      contadorCalidadSimulada > 0
        ? Number((sumaCalidadSimulada / contadorCalidadSimulada).toFixed(2))
        : 0;

    return {
      proyecto: projectId,
      criterio,
      tiempoTotalEstimado: Number(tiempoTotalEstimado.toFixed(2)),
      tiempoTotalSimulado: Number(tiempoTotalSimulado.toFixed(2)),
      calidadPromedioTareas,
      calidadPromedioSimulado,
      costoTotalSimulado: Number(costoTotalSimulado.toFixed(2)),
    };
  };

  // tomar projectId (del primero que exista)
  const projectIdBase =
    resultadoCompleto?.basica?.projectId ||
    resultadoCompleto?.costo?.projectId ||
    resultadoCompleto?.tiempoIA?.projectId ||
    resultadoCompleto?.calidad?.projectId;

  if (!projectIdBase) {
    throw new Error("No se encontró projectId en el resultado completo.");
  }

  const globalesPorCriterio = {};

  for (const key of CRITERIOS) {
    if (!resultadoCompleto[key]) continue;

    const globales = calcularUno(resultadoCompleto[key]);

    // (opcional) validar que todos tengan el mismo projectId
    if (String(globales.proyecto) !== String(projectIdBase)) {
      throw new Error(
        `projectId inconsistente en criterio ${key}. Esperado=${projectIdBase}, recibido=${globales.proyecto}`
      );
    }

    globalesPorCriterio[key] = globales;
  }

  return {
    proyecto: projectIdBase,
    globalesPorCriterio,
  };
};
