import mongoose from "mongoose";

const resultadoCriterioSchema = new mongoose.Schema({
  criterio: { type: String, required: true }, // "Disponibilidad", "Costo ($)", etc.
  costoTotal: { type: Number, required: true },
  tiempoTotal: { type: Number, required: true }, // días totales estimados
  calidad: { type: Number, min: 1, max: 5 }, // promedio de estrellas o puntuación
  fechaGeneracion: { type: Date, default: Date.now }
}, { _id: false });

const resumenAsignacionSchema = new mongoose.Schema({
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  resultados: [resultadoCriterioSchema],
  generadoEn: { type: Date, default: Date.now },
  generadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  notas: { type: String }
});

export default mongoose.model("ResumenAsignacion", resumenAsignacionSchema);
