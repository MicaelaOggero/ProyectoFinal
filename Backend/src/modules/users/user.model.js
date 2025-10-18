import mongoose from 'mongoose';


const calendarioSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    horasDisponibles: { type: Number, default: 8 }, // ej: 8h por día
  },
  { _id: false }
);

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
  preferenciasHabilidad: {
  type: [
    {
      habilidad: String,
      puntuacionPromedio: { type: Number, min: 1, max: 5 },
      vecesCalificado: { type: Number, default: 0 }
    }
  ],
  default: [] // <-- inicializa como arreglo vacío
},
preferenciasTarea: {
  type: [
    {
      habilidad: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
          default: null
        },
      puntuacionPromedio: { type: Number, min: 1, max: 5 },
      vecesCalificado: { type: Number, default: 0 }
    }
  ],
  default: [] // <-- inicializa como arreglo vacío
},

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
  },
  // ⏱ Máxima capacidad semanal
  horasSemanalMaxima: { type: Number, default: 40 },
  calendario: {
    type: [calendarioSchema], // array de días con disponibilidad
    default: [],
  },
  
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
