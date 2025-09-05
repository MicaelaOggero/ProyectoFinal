import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true
  },
  habilidadesRequeridas: [{
    type: String,
    required: true
  }],
  nivelDificultad: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  prioridad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    required: true
  },
  fechaEntrega: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en curso', 'completada'],
    default: 'pendiente'
  },
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  desarrolladorAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  historial: [{
    campo: String,
    valorAnterior: mongoose.Schema.Types.Mixed,
    valorNuevo: mongoose.Schema.Types.Mixed,
    cambiadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCambio: { type: Date, default: Date.now }
  }],
  tiempoEstimadoHoras: Number,
  tiempoInvertidoHoras: { type: Number, default: 0 },
  comentarios: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mensaje: String,
    fecha: { type: Date, default: Date.now }
  }]
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
