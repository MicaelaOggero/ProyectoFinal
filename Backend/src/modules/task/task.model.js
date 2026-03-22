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
  categoria: { type: String, enum: ['frontend', 'backend', 'testing', 'documentacion', 'machine learning'], required: true },
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
  estado: {
    type: String,
    enum: ['pendiente', 'en curso', 'pausada', 'completada', 'retrasada'],
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
  tiempoInvertidoHoras: { type: Number, default: 0 },
  comentarios: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mensaje: String,
    fecha: { type: Date, default: Date.now }
  }],
  tiempoEstimadoHoras: {
    type: Number,
    required: true
  },
  porcentajeTiempoInvertido: {
    type: Number,
    default: 0
  },
  fechaEstimadaFin: Date,
  fechaEstimadaInicio: Date,
  fechaRealFin: Date,
  fechaRealInicio: Date,
  asignada: {
    type: Boolean,
    default: false
  },
  enTrabajoDesde: Date,
  cronometroActivo: {
    type: Boolean,
    default: false
  },
  sesionActiva: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SesionTrabajo',
    default: null
  },
  retrasada: {
    type: Boolean,
    default: false
  },
  notificacionRetrasadaEnviada: {
    type: Boolean,
    default: false
  }

});



const Task = mongoose.model('Task', taskSchema);
export default Task;
