
import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

class UserService {
  constructor() {
    // Configurar axios para incluir cookies automáticamente
    axios.defaults.withCredentials = true;
  }

  getUsers() {
    return axios.get(`${API_URL}/user`);
  }

  updateUser(id, user) {
    return axios.put(`${API_URL}/user/${id}`, user);
  }

  deleteUser(id) {
    return axios.delete(`${API_URL}/user/${id}`);
  }
  
  getUserById(id) {
    return axios.get(`${API_URL}/user/${id}`);
  }

  // Funciones para manejar el calendario de disponibilidad
  getUserCalendar(userId, month = null) {
    const params = month ? { month } : {};
    return axios.get(`${API_URL}/user/${userId}/calendario`, { params });
  }

  updateUserCalendar(userId, calendarData) {
    return axios.put(`${API_URL}/user/${userId}/calendario`, calendarData);
  }

  addCalendarEntry(userId, entry) {
    return axios.post(`${API_URL}/user/${userId}/calendario`, entry);
  }

  removeCalendarEntry(userId, date) {
    return axios.delete(`${API_URL}/user/${userId}/calendario/${date}`);
  }

  // Crear calendario para un usuario específico
  createCalendar(userId) {
    return axios.post(`${API_URL}/user/crearCalendario/${userId}`);
  }

  /**
   * Obtener desarrolladores con disponibilidad para una tarea (para asignación manual).
   * Payload: { tareaId, nombre, descripcion?, fechaEstimadaInicio, fechaEstimadaFin, habilidadesRequeridas?, prioridad?, estimacionHoras, sinCandidatos?, candidatosDisponibles? }
   * Devuelve: { ok, message, data: { tarea, total, candidatos: [{ _id, nombre, email }] } }
   */
  getCandidatosDisponibles(payload) {
    return axios.post(`${API_URL}/user/candidatos`, payload);
  }
}

export default new UserService();
