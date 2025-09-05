import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
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
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  administrador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // asegura que cada proyecto tenga un admin asignado
  },
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
