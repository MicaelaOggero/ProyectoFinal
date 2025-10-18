// models/taskLog.model.js
import mongoose from "mongoose";

const taskLogSchema = new mongoose.Schema({
  tarea: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  desarrollador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Tiempo estimado (de la planificación)
  duracionEstimadaHoras: { type: Number, required: true },

  // Tiempo real invertido (registrado al finalizar)
  tiempoInvertidoHoras: { type: Number, required: true },

  // Estado final (completada, retrasada, adelantada, cancelada)
  estado: {
    type: String,
    enum: ["completada", "retrasada", "adelantada", "cancelada"],
    default: "completada",
  },

  // Auto-timestamp
  creadoEn: { type: Date, default: Date.now }
});

const TaskLog = mongoose.model("TaskLog", taskLogSchema);
export default TaskLog;
