import Task from "../task/task.model.js";      // ajustá ruta real
import User from "../users/user.model.js";      // ajustá ruta real
import { obtenerDisponibilidadEnRango } from "../../utils/asignacionBasica/diasDisponible.js"; // ajustá ruta real
import { asignarTareaManual } from "../assignment/assignment.service.js"; // ajustá ruta real
import { findSimulacionByProyectoDAO } from "./simulationAssignment.dao.js";

// obtener simulación por ID del proyecto
export const obtenerSimulacionPorProyectoService = async (projectId) => {
  if (!projectId) {
    throw new Error("projectId requerido");
  }

  return await findSimulacionByProyectoDAO(projectId);
};

/**
 * Calcula los datos globales de una simulación a partir del resultado de la IA
 */

// Helpers
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const sumDisponibilidad = (dias = []) =>
  (dias || []).reduce((acc, d) => acc + (Number(d.horas) || 0), 0);

const distribuirHorasDesdeDiasDisponibles = (diasDisponibles = [], horasNecesarias) => {
  let restantes = Number(horasNecesarias) || 0;
  const dias = [];

  for (const d of diasDisponibles || []) {
    if (restantes <= 0) break;

    const libres = Number(d.horas) || 0;
    if (libres <= 0) continue;

    const asignadas = Math.min(libres, restantes);

    dias.push({
      // en tu payload de asignaciones usás Date ISO con T00:00:00.000Z
      fecha: new Date(d.fecha).toISOString(),
      horasAsignadas: asignadas,
    });

    restantes -= asignadas;
  }

  return {
    ok: restantes <= 0,
    dias,
    horasTotales: dias.reduce((a, x) => a + (Number(x.horasAsignadas) || 0), 0),
  };
};

const elegirCandidato = (criterio, candidatos = []) => {
  if (!Array.isArray(candidatos) || candidatos.length === 0) return null;

  const c = [...candidatos];

  switch (criterio) {
    case "basica":
    case "disponibilidad":
      // más horas disponibles acumuladas
      c.sort((a, b) => sumDisponibilidad(b.diasDisponibles) - sumDisponibilidad(a.diasDisponibles));
      return c[0];

    case "costo":
      c.sort((a, b) => (Number(a.costoPorHora) || Infinity) - (Number(b.costoPorHora) || Infinity));
      return c[0];

    case "tiempo":
      c.sort((a, b) => {
        const pa = Number(a?.rendimientoHistorico?.promedioPorcentaje) || 0;
        const pb = Number(b?.rendimientoHistorico?.promedioPorcentaje) || 0;
        if (pb !== pa) return pb - pa;
        const ta = Number(a?.rendimientoHistorico?.tareasCompletadas) || 0;
        const tb = Number(b?.rendimientoHistorico?.tareasCompletadas) || 0;
        return tb - ta;
      });
      return c[0];

    case "calidad":
      c.sort((a, b) => {
        const qa = Number(a?.puntuacionPromedioCalidad?.puntuacionPromedio) || 0;
        const qb = Number(b?.puntuacionPromedioCalidad?.puntuacionPromedio) || 0;
        if (qb !== qa) return qb - qa;
        const fa = Number(a?.feedbackHistorico?.puntuacionPromedio) || 0;
        const fb = Number(b?.feedbackHistorico?.puntuacionPromedio) || 0;
        return fb - fa;
      });
      return c[0];

    default:
      return c[0];
  }
};

const completarAsignacionSiIATiro = ({ criterioKey, asignacion }) => {
  // Condición de “IA falló”: no asignó dev pero hay candidatos
  const tieneDev = asignacion?.desarrolladorId != null && asignacion?.desarrolladorId !== "";
  const candidatos = asignacion?.candidatosDisponibles;

  if (tieneDev) return asignacion;
  if (!Array.isArray(candidatos) || candidatos.length === 0) return asignacion;

  // horas necesarias: en tu JSON de ejemplo, las tareas sin asignar usan estimacionHoras
  // para las asignadas se usa horasTotales
  const horasNecesarias =
    Number(asignacion?.horasTotales) ||
    Number(asignacion?.estimacionHoras) ||
    Number(asignacion?.tiempoEstimadoHoras) ||
    0;

  if (!horasNecesarias || horasNecesarias <= 0) {
    // no podemos distribuir sin horas
    return asignacion;
  }

  const candidato = elegirCandidato(criterioKey, candidatos);
  if (!candidato) return asignacion;

  const dist = distribuirHorasDesdeDiasDisponibles(candidato.diasDisponibles, horasNecesarias);
  if (!dist.ok) {
    // candidato elegido no cubre todas las horas (en preview solo dejamos así)
    return asignacion;
  }

  const costoPorHora = Number(candidato.costoPorHora) || 0;
  const costoTotal = round2(costoPorHora * dist.horasTotales);

  const rendimiento = candidato?.rendimientoHistorico ?? { promedioPorcentaje: 0, tareasCompletadas: 0 };
  const promedio = Number(rendimiento?.promedioPorcentaje) || 0;
  const horasEstimadasSegunRendimiento =
    promedio > 0 ? round2(dist.horasTotales * (100 / promedio)) : round2(dist.horasTotales);

  const calidadTarea = Number(candidato?.puntuacionPromedioCalidad?.puntuacionPromedio) || 0;
  const feedbackHistorico = Number(candidato?.feedbackHistorico?.puntuacionPromedio) || 0;

  return {
    ...asignacion,
    // completar datos clave
    desarrolladorId: String(candidato.id),
    nombre: candidato.nombre,
    apellido: candidato.apellido,
    dias: dist.dias,
    horasTotales: dist.horasTotales,
    tipoAsignacion: criterioKey, // "basica" | "costo" | "tiempo" | "calidad"
    razon: `Corrección automática: IA no asignó la tarea pero había candidatos disponibles. Se eligió ${candidato.nombre} ${candidato.apellido}.`,
    costoTotal,
    rendimientoHistorico: {
      promedioPorcentaje: Number(rendimiento.promedioPorcentaje || 0),
      tareasCompletadas: Number(rendimiento.tareasCompletadas || 0),
    },
    horasEstimadasSegunRendimiento,
    calidadTarea,
    feedbackHistorico,
    sinCandidatos: false, // por definición acá sí hay candidatos
  };
};

const validarYAutocompletarPreview = (resumen) => {
  const claves = ["basica", "costo", "tiempo", "calidad"];

  for (const k of claves) {
    const bloque = resumen?.[k];
    if (!bloque?.asignaciones) continue;

    bloque.asignaciones = bloque.asignaciones.map((a) =>
      completarAsignacionSiIATiro({ criterioKey: k, asignacion: a })
    );
  }

  return resumen;
};



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

  const resumen = {
    basica: jsonBasica,
    costo: jsonCosto,
    tiempo: jsonTiempoIA,
    calidad: jsonCalidad,
  };

  // ✅ corregir si IA dejó tareas sin asignar teniendo candidatos
  return validarYAutocompletarPreview(resumen);
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
  console.log("Payload recibido en verificarDisponibilidadAcumuladaAsignacionesManualesService:");
  console.log(payload);
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



const CRITERIOS = ["basica", "costo", "tiempo", "calidad"];

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

  const CRITERIOS = ["basica", "costo", "tiempo", "calidad"];

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

function buildSinCandidatosFromTaskDB(taskDoc) {
  return {
    tareaId: String(taskDoc._id),
    descripcion: taskDoc.descripcion,
    fechaEstimadaInicio: taskDoc.fechaEstimadaInicio,
    fechaEstimadaFin: taskDoc.fechaEstimadaFin,
    habilidadesRequeridas: Array.isArray(taskDoc.habilidadesRequeridas)
      ? taskDoc.habilidadesRequeridas
      : [],
    prioridad: taskDoc.prioridad,
    estimacionHoras: Number(taskDoc.tiempoEstimadoHoras) || 0, // ✅ mapeo real
    sinCandidatos: true,
  };
}

import mongoose from "mongoose";

function esSinCandidatosEnBasica(a) {
  const sin = a?.sinCandidatos === true;
  const candidatosVacios =
    Array.isArray(a?.candidatosDisponibles) && a.candidatosDisponibles.length === 0;
  return sin || candidatosVacios;
}

/**
 * REQUIERE conexión a DB ya activa (NO llama connectDB).
 * Reemplaza SOLO las tareas sin candidatos en basica por el formato mínimo reconstruido desde DB.
 */
export async function completarBasicaSinCandidatosConDB(payload) {
  if (!payload?.basica?.asignaciones || !Array.isArray(payload.basica.asignaciones)) {
    throw new Error('Falta "basica.asignaciones".');
  }

  const targets = payload.basica.asignaciones
    .map((a, idx) => ({ a, idx }))
    .filter(({ a }) => esSinCandidatosEnBasica(a));

  if (targets.length === 0) return payload;

  const ids = targets
    .map(({ a }) => String(a?.tareaId || ""))
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const tasksDB = await Task.find({ _id: { $in: ids } }).lean();
  const mapDB = new Map(tasksDB.map((t) => [String(t._id), t]));

  const errores = [];

  for (const { a, idx } of targets) {
    const tareaId = String(a?.tareaId || "");

    if (!mongoose.Types.ObjectId.isValid(tareaId)) {
      errores.push({ idx, tareaId, motivo: "tareaId inválido (no ObjectId)" });
      continue;
    }

    const taskDoc = mapDB.get(tareaId);
    if (!taskDoc) {
      errores.push({ idx, tareaId, motivo: "No existe en DB" });
      continue;
    }

    const reconstruida = buildSinCandidatosFromTaskDB(taskDoc);

    // si querés permitir 0, sacá este check
    if (!(Number(reconstruida.estimacionHoras) > 0)) {
      errores.push({
        idx,
        tareaId,
        motivo: "tiempoEstimadoHoras inválido (<=0) en DB",
      });
      continue;
    }

    // ✅ reemplazo total en BASICA para mantener formato mínimo
    payload.basica.asignaciones[idx] = reconstruida;
  }

  if (errores.length > 0) {
    const err = new Error(
      `No se pudieron reconstruir algunas tareas sin candidatos desde DB: ${JSON.stringify(
        errores,
        null,
        2
      )}`
    );
    err.statusCode = 400;
    throw err;
  }

  return payload;
}
