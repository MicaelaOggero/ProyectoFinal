import axios from 'axios';

const API_URL = 'http://localhost:8080/api/task';

// Configurar axios para incluir cookies en todas las requests
axios.defaults.withCredentials = true;

class TaskService {
  // Obtener tareas por proyecto
  async getTasksByProject(projectId) {
    try {
      const response = await axios.get(`${API_URL}/proyecto/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getTasksByProject:', error);
      throw error;
    }
  }

  // Obtener tareas por desarrollador
  async getTasksByDeveloper(userId) {
    try {
      const response = await axios.get(`${API_URL}/desarrollador/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getTasksByDeveloper:', error);
      throw error;
    }
  }

  // Crear tarea (requiere projectId en la URL)
  async createTask(projectId, taskData) {
    try {
      console.log('TaskService.createTask - projectId:', projectId, 'taskData:', taskData);
      const url = `${API_URL}/${projectId}`;
      console.log('URL de la petición:', url);
      const response = await axios.post(url, taskData);
      return response.data;
    } catch (error) {
      console.error('Error en createTask:', error);
      throw error;
    }
  }

  // Actualizar tarea (usar PATCH según el backend)
  async updateTask(taskId, taskData) {
    try {
      console.log('TaskService.updateTask - taskId:', taskId, 'taskData:', taskData);
      const response = await axios.patch(`${API_URL}/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error en updateTask:', error);
      throw error;
    }
  }

  // Eliminar tarea
  async deleteTask(taskId) {
    try {
      const response = await axios.delete(`${API_URL}/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteTask:', error);
      throw error;
    }
  }

  // Obtener tarea por ID
  async getTaskById(taskId) {
    try {
      const response = await axios.get(`${API_URL}/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getTaskById:', error);
      throw error;
    }
  }
}

export default new TaskService(); 