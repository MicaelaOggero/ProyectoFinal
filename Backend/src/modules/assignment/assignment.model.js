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
  creadoEn: { type: Date, default: Date.now }
});

export default mongoose.model("Asignacion", asignacionSchema);
