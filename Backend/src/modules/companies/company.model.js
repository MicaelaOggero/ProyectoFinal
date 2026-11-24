import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 120 },
  activa: { type: Boolean, default: true },
  creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Empresa', companySchema);
