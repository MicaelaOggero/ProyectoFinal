import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  receptor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // admin
  emisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },   // dev (opcional)
  tipo: {
    type: String,
    enum: ["CALIFICAR_TAREA"],
    required: true
  },

  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  tarea: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  taskLog: { type: mongoose.Schema.Types.ObjectId, ref: "TaskLog", required: true },

  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },

  leida: { type: Boolean, default: false },
  resuelta: { type: Boolean, default: false },
  creadaEn: { type: Date, default: Date.now },
  leidaEn: { type: Date, default: null },
  resueltaEn: { type: Date, default: null },
});

export default mongoose.model("Notification", notificationSchema);
