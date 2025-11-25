import mongoose from "mongoose";

const performanceFeedbackSchema = new mongoose.Schema({
  proyecto: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  desarrollador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  administrador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  puntuacion: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String },
  fecha: { type: Date, default: Date.now }
});

const PerformanceFeedback = mongoose.model("PerformanceFeedback", performanceFeedbackSchema);
export default PerformanceFeedback;
