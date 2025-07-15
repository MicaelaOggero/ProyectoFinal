import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  dni: {
    type: String,
    required: true,
    unique: true
  },
  nombre: String,
  apellido: String,
  rol: {
    type: String,
    enum: ['admin', 'desarrollador'],
    required: true
  },
  habilidades: [{
    nombre: String,
    nivel: { type: Number, min: 1, max: 5 },
    aniosExperiencia: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  disponibilidadSemanal: Number, //Horas hombre por semana
  preferencias: {
    tipoTarea: [String],       // ej: ['frontend', 'testing']
    tecnologias: [String],     // ej: ['React', 'MongoDB']
  },
  historialDesempeño: [{
    proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    calificacion: Number,
    comentario: String
  }],
  costoPorHora: Number,
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
  
});

const User = mongoose.model('User', userSchema);
export default User;
