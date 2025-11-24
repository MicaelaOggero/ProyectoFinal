import mongoose from 'mongoose';

const historialSchema = new mongoose.Schema({
  accion: { type: String, required: true }, // Ej: "Inicio", "Pausa", "Reanudación", etc.
  fecha: { type: Date, default: Date.now },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // quién hizo el cambio
  descripcion: { type: String } // información adicional opcional
}, { _id: false });

const projectSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String
  },
  fechaInicioEstimada: {
    type: Date,
    required: true
  },
  fechaFinEstimada: {
    type: Date,
    required: true
  },
  fechaInicioReal: {
    type: Date
  },
  fechaFinReal: {
    type: Date
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  nivelDificultad: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  prioridad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media',
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "en curso", "pausado", "finalizado"],
    default: 'activo'
  },
  historial: {
    type: [historialSchema],
    default: []
  },
  administrador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // asegura que cada proyecto tenga un admin asignado
  },
  costoTotal: {
    type: Number,
    default: 0
  }
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
