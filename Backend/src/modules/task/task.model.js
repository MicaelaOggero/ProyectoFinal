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
  plazoEntrega: {
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
  }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
