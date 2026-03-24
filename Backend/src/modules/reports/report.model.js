import mongoose from "mongoose";

const developerSummarySchema = new mongoose.Schema({
  desarrolladorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nombre: { type: String, default: "" },
  apellido: { type: String, default: "" },
  expectedHours: { type: Number, default: 0 },
  realHours: { type: Number, default: 0 },
  expectedCost: { type: Number, default: 0 },
  realCost: { type: Number, default: 0 },
  tareasCompletadas: { type: Number, default: 0 },
  tareasRetrasadas: { type: Number, default: 0 },
  promedioCalidad: { type: Number, default: 0 },
  promedioRendimiento: { type: Number, default: 0 },
}, { _id: false });

const taskSummarySchema = new mongoose.Schema({
  tareaId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  descripcion: { type: String, default: "" },
  expected: {
    horasTotales: { type: Number, default: 0 },
    costoTotal: { type: Number, default: 0 },
    horasEstimadasReales: { type: Number, default: 0 },
    puntuacionCalidad: { type: Number, default: 0 },
    feedbackHistorico: { type: Number, default: 0 },
  },
  real: {
    tiempoInvertidoHoras: { type: Number, default: 0 },
    costoTotal: { type: Number, default: 0 },
    estado: { type: String, default: "" },
    puntuacionCalidad: { type: Number, default: 0 },
    rendimiento: { type: Number, default: 0 },
  },
}, { _id: false });

const finalProjectReportSchema = new mongoose.Schema({
  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  expected: {
    tiempoTotalEstimado: { type: Number, default: 0 },
    tiempoTotalSimulado: { type: Number, default: 0 },
    calidadPromedioTareas: { type: Number, default: 0 },
    calidadPromedioSimulado: { type: Number, default: 0 },
    costoTotalSimulado: { type: Number, default: 0 },
  },
  real: {
    tiempoTotalEstimado: { type: Number, default: 0 },
    tiempoTotalSimulado: { type: Number, default: 0 },
    calidadPromedioTareas: { type: Number, default: 0 },
    calidadPromedioSimulado: { type: Number, default: 0 },
    costoTotalSimulado: { type: Number, default: 0 },
  },
  tareas: {
    total: { type: Number, default: 0 },
    completadas: { type: Number, default: 0 },
    retrasadas: { type: Number, default: 0 },
    canceladas: { type: Number, default: 0 },
  },
  tareasDetalle: { type: [taskSummarySchema], default: [] },
  desarrolladores: { type: [developerSummarySchema], default: [] },
  creadoEn: { type: Date, default: Date.now },
});

export default mongoose.model("FinalProjectReport", finalProjectReportSchema);
