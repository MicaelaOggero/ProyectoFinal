import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  rol: { type: String, enum: ['admin', 'user'], required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  invitadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venceEn: { type: Date, required: true },
  aceptadaEn: { type: Date, default: null }
}, { timestamps: true });

invitationSchema.index({ empresa: 1, email: 1, aceptadaEn: 1 });
export default mongoose.model('InvitacionEmpresa', invitationSchema);
