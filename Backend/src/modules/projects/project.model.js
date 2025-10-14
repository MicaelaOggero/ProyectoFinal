import mongoose from 'mongoose';

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
    enum: ['activo', 'pausado', 'finalizado'],
    default: 'activo'
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
