import mongoose from "mongoose";

const taskPreferenceRatingSchema = new mongoose.Schema({
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  desarrollador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  puntuacion: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comentario: {
    type: String,
    default: ""
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

taskPreferenceRatingSchema.index(
  { tarea: 1, desarrollador: 1 },
  { unique: true }
);

const TaskPreferenceRating = mongoose.model(
  "TaskPreferenceRating",
  taskPreferenceRatingSchema
);

export default TaskPreferenceRating;
