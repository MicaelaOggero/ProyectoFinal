
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
  updateUserCalendar(userId, calendarData) {
    return axios.put(`${API_URL}/user/${userId}/calendar`, { calendario: calendarData });
  }

  addCalendarEntry(userId, entry) {
    return axios.post(`${API_URL}/user/${userId}/calendar`, entry);
  }

  removeCalendarEntry(userId, date) {
    return axios.delete(`${API_URL}/user/${userId}/calendar/${date}`);
  }

  getUserCalendar(userId) {
    return axios.get(`${API_URL}/user/${userId}/calendar`);
  }
}

export default new UserService();
