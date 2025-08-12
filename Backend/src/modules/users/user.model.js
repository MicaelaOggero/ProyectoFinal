import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  dni: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    required: true
  },
  habilidades: {
    type: [
      {
        nombre: { type: String, required: true },
        nivel: { type: Number, min: 1, max: 5, required: true }
      }
    ],
    required: true
  },

  aniosExperiencia: {
    type: Number,
    min: 0,
    default: 0,
    required: true
  },

  disponibilidadSemanal: {
    type: Number,
    required: true
  }, //Horas hombre por semana
  preferencias: {
    tipoTarea: [String],       // ej: ['frontend', 'testing']
    tecnologias: [String],     // ej: ['React', 'MongoDB']
  },
  historialDesempeño: [{
    proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    calificacion: Number,
    comentario: String
  }],
  costoPorHora: {
    type: Number,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'El formato del email no es válido']
  },

  password: {
    type: String,
    required: true,
  }

});

const User = mongoose.model('User', userSchema);
export default User;
