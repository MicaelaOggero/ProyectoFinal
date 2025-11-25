import mongoose from "mongoose";

const asignacionSchema = new mongoose.Schema({
  tarea: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  desarrollador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dias: [
    {
      fecha: { type: Date, required: true },
      horasAsignadas: { type: Number, required: true }
    }
  ],
  horasTotales: { type: Number, required: true },
  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

  tipoAsignacion: {
    type: String,
    enum: ["basica", "costo", "tiempo", "calidad"],
    default: "basica"
  },
  razon: { type: String },
  creadoEn: { type: Date, default: Date.now },

  //costo
  costoPorHora: { type: Number }, 
  costoTotal: { type: Number },
  //tiempo
  porcentajeRendimiento: { type: Number, default: null},
  horasEstimadasReales: { type: Number, default: null},
  //calidad
  puntuacionCalidad: { type: Number, min: 0, max: 5 , default: null },
  feedbackHistorico:{type: Number, min: 0, max: 5 , default: null }
});


export default mongoose.model("Asignacion", asignacionSchema);
