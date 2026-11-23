import mongoose from "mongoose";

const simulacionAsignacionSchema = new mongoose.Schema({
  proyecto: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project", 
    required: true 
  },

  criterio: {
    type: String,
    enum: ["basica", "costo", "tiempo", "calidad"],
    required: true
  },

  asignaciones: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asignacion",
      required: true
    }
  ],
  
  // 📌 Datos globales del proyecto en esta simulación
  tiempoTotalEstimado: { type: Number },        // suma de tiempoEstimadoHoras original
  tiempoTotalSimulado: { type: Number },        // suma de horasEstimadasReales
  calidadPromedioTareas: { type: Number },   // promedio de calidad de las tareas
  calidadPromedioSimulado: { type: Number },    // promedio final de calidad
  costoTotalSimulado: { type: Number },         // costo total del proyecto en esta simulación

  creadoEn: { type: Date, default: Date.now }
});


export default mongoose.model("SimulacionAsignacion", simulacionAsignacionSchema);
