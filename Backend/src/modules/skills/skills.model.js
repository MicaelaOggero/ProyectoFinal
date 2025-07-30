// models/habilidad.model.js
import mongoose from 'mongoose';

const habilidadSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  fuente: { type: String, default: 'dev.to' },
  fechaCreacion: { type: Date, default: Date.now }
});

const Habilidad = mongoose.model('Habilidad', habilidadSchema);
export default Habilidad;
