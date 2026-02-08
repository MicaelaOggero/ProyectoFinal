import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

axios.defaults.withCredentials = true;

/**
 * Servicio de notificaciones.
 * Backend: PATCH /api/notification/:notificationId/calificar (auth admin)
 * Body: { puntuacionCalidad: 1-5 }
 * Respuesta 200: { ok: true, message, data: { taskLogId, proyectoId, tareaId, desarrolladorId, puntuacionCalidad, promedioCalidadDesarrollador, notificationId } }
 */
class NotificationService {
  /**
   * Calificar la calidad de una tarea desde una notificación (solo admin).
   * @param {string} notificationId - ID de la notificación
   * @param {number} puntuacionCalidad - Puntuación de 1 a 5
   * @returns {Promise<{ ok: boolean, message: string, data?: object }>}
   */
  async calificarTareaDesdeNotificacion(notificationId, puntuacionCalidad) {
    const puntaje = Number(puntuacionCalidad);
    if (!Number.isFinite(puntaje) || puntaje < 1 || puntaje > 5) {
      throw new Error('puntuacionCalidad debe ser un número entre 1 y 5');
    }
    const response = await axios.patch(
      `${API_URL}/notification/${notificationId}/calificar`,
      { puntuacionCalidad: puntaje }
    );
    return response.data;
  }

  /**
   * Obtener notificaciones del usuario logueado (receptor).
   * GET /api/notification - requiere auth.
   * Respuesta: { ok: true, data: [ { _id, tipo, titulo, mensaje, proyecto, tarea, taskLog, emisor, data, leida, resuelta, creadaEn, ... } ] }
   */
  async getMisNotificaciones() {
    const response = await axios.get(`${API_URL}/notification`);
    const data = response.data?.data;
    return Array.isArray(data) ? data : [];
  }
}

export default new NotificationService();
