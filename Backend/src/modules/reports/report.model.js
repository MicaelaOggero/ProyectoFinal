import mongoose from "mongoose";

const timeValueSchema = new mongoose.Schema({
  valor: { type: Number, default: 0 },
  unidad: { type: String, enum: ["segundos", "minutos", "horas"], default: "horas" },
}, { _id: false });

const developerSummarySchema = new mongoose.Schema({
  desarrolladorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nombre: { type: String, default: "" },
  apellido: { type: String, default: "" },
  expectedHours: { type: timeValueSchema, default: () => ({}) },
  realHours: { type: timeValueSchema, default: () => ({}) },
  expectedCost: { type: Number, default: 0 },
  realCost: { type: Number, default: 0 },
  tareasCompletadas: { type: Number, default: 0 },
  tareasRetrasadas: { type: Number, default: 0 },
  calidadTareas: { type: Number, default: 0 },
  calidadProyecto: { type: Number, default: 0 },
  calidadTareasEsperada: { type: Number, default: 0 },
  calidadProyectoEsperada: { type: Number, default: 0 },
  promedioRendimiento: { type: Number, default: 0 },
}, { _id: false });

const taskSummarySchema = new mongoose.Schema({
  tareaId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  descripcion: { type: String, default: "" },
  categoria: { type: String, default: "" },
  nivelDificultad: { type: Number, default: 0 },
  prioridad: { type: String, default: "" },
  desarrolladorAsignadoNombre: { type: String, default: "" },
  expected: {
    horasTotales: { type: Number, default: 0 },
    costoTotal: { type: Number, default: 0 },
    horasEstimadasReales: { type: Number, default: 0 },
    puntuacionCalidad: { type: Number, default: 0 },
  },
  real: {
    tiempoInvertido: { type: timeValueSchema, default: () => ({}) },
    costoTotalReal: { type: Number, default: 0 },
    estado: { type: String, default: "" },
    calidadTareaReal: { type: Number, default: 0 },
  },
}, { _id: false });

const finalProjectReportSchema = new mongoose.Schema({
  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  nombreProyecto: { type: String, default: "" },
  descripcionProyecto: { type: String, default: "" },
  fechaInicioEstimada: { type: Date },
  fechaFinEstimada: { type: Date },
  fechaCreacion: { type: Date },
  nivelDificultad: { type: Number, default: 0 },
  prioridad: { type: String, default: "" },
  nombreAdministrador: { type: String, default: "" },
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
    tiempoTotalReal: { type: timeValueSchema, default: () => ({}) },
    calidadPromedioTareasReal: { type: Number, default: 0 },
    calidadPromedioProyectoReal: { type: Number, default: 0 },
    costoTotalReal: { type: Number, default: 0 },
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
