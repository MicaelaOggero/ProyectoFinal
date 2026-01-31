import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  receptor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // admin
  emisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },   // dev (opcional)

  tipo: {
    type: String,
    enum: ["CALIFICAR_TAREA", "CALIFICAR_PROYECTO_LOTE"],
    required: true
  },

  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

  // Solo para CALIFICAR_TAREA
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: function () { return this.tipo === "CALIFICAR_TAREA"; },
    default: null
  },
  taskLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TaskLog",
    required: function () { return this.tipo === "CALIFICAR_TAREA"; },
    default: null
  },

  // ✅ Para CALIFICAR_PROYECTO_LOTE
  data: {
    desarrolladores: [{
      desarrolladorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      puntuacion: { type: Number, min: 1, max: 5, default: null },
      comentario: { type: String, default: "" },
      calificadoEn: { type: Date, default: null }
    }]
  },

  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },

  leida: { type: Boolean, default: false },
  resuelta: { type: Boolean, default: false },
  creadaEn: { type: Date, default: Date.now },
  leidaEn: { type: Date, default: null },
  resueltaEn: { type: Date, default: null },
});

export default mongoose.model("Notification", notificationSchema);
