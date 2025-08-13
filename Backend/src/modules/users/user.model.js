import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true // para que no exija que todos los usuarios tengan googleId
  },
  dni: {
    type: String,
    unique: true,
    default: 0
  },
  nombre: {
    type: String,
  },
  apellido: {
    type: String,
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
        nombre: {
          type: String,
          required: true
        },
        aniosExperiencia: {
          type: Number,
          min: 0,
          default: 0,
          required: true
        }
      }
    ],
    required: true,
    default: []
  },

  aniosExperiencia: {
    type: Number,
    min: 0,
    default: 0,
    required: true
  },

  disponibilidadSemanal: {
    type: Number,
    required: true,
    default: 0
  }, // Horas hombre por semana

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
    required: true,
    default: 0
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
    required: function () { return !this.googleId; }
  }
});

const User = mongoose.model('User', userSchema);
export default User;
