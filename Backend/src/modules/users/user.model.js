import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true // para que no exija que todos los usuarios tengan googleId
  },
  dni: {
    type: String,
  },
  nombre: {
    type: String,
    required: function () { return !this.googleId; }
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
        nombre: { type: String, required: true },
        nivel: { type: Number, min: 1, max: 5, required: true }
      }
    ],
    default: [],
    required: function () { return this.rol === 'user' || !this.googleId; }
  },
  aniosExperiencia: {
    type: Number,
    min: 0,
    default: 0,
    required: function () { return this.rol === 'user' || !this.googleId;; }
  },
  disponibilidadSemanal: {
    type: Number,
    required: function () { return this.rol === 'user' || !this.googleId;; },
    default: 0
  }, //Horas hombre por semana
  preferencias: [{
    habilidad: String,
    puntuacionPromedio: { type: Number, min: 1, max: 5 },
    vecesCalificado: { type: Number, default: 0 }
  }],
  costoPorHora: {
    type: Number,
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
