import mongoose from "mongoose";

const sesionTrabajoSchema = new mongoose.Schema({
  tareaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  desarrolladorAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  proyectoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaFin: {
    type: Date,
    default: null
  },
  tiempoTrabajadoHoras: {
    type: Number,
    default: 0
  },
  editadaManualmente: {
    type: Boolean,
    default: false
  },
  motivoEdicion: {
    type: String,
    default: ""
  },
  estado: {
    type: String,
    enum: ["activa", "cerrada"],
    default: "activa"
  }
}, { timestamps: true });

const SesionTrabajo = mongoose.model("SesionTrabajo", sesionTrabajoSchema);
export default SesionTrabajo;