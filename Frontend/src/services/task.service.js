import axios from 'axios';

const API_URL = 'http://localhost:8080/api/task';

// Configurar axios para incluir cookies en todas las requests
axios.defaults.withCredentials = true;

class TaskService {
  async getTasksByProject(projectId) {
    try {
      const response = await axios.get(`${API_URL}/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getTasksByProject:', error);
      throw error;
    }
  }

  async createTask(task) {
    try {
      const response = await axios.post(API_URL, task);
      return response;
    } catch (error) {
      console.error('Error en createTask:', error);
      throw error;
    }
  }

  async updateTask(id, task) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, task);
      return response;
    } catch (error) {
      console.error('Error en updateTask:', error);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteTask:', error);
      throw error;
    }
  }
}

export default new TaskService(); 