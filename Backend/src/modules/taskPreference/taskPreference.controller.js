import {
  getPendingTaskPreferenceRatings,
  rateTaskForPreferences
} from "./taskPreference.service.js";

export async function listarTareasPendientesDeCalificar(req, res) {
  try {
    const tareas = await getPendingTaskPreferenceRatings(req.user._id);
    return res.status(200).json({ tareas });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function calificarTareaParaPreferencias(req, res) {
  try {
    const result = await rateTaskForPreferences({
      taskId: req.params.taskId,
      developerId: req.user._id,
      puntuacion: req.body?.puntuacion,
      comentario: req.body?.comentario
    });

    return res.status(201).json({
      message: "Calificacion guardada y preferencias actualizadas",
      data: result
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 2b4a6d226b982b5798c3daa6729c74038a5743d3
