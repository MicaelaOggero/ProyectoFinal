import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

// Configurar axios para incluir cookies en todas las requests
axios.defaults.withCredentials = true;

class TaskService {
  // Obtener tareas por proyecto
  async getTasksByProject(projectId) {
    try {
      console.log('🔍 TaskService - getTasksByProject - projectId:', projectId);
      console.log('🔍 TaskService - URL completa:', `${API_URL}/task/proyecto/${projectId}`);
      const response = await axios.get(`${API_URL}/task/proyecto/${projectId}`);
      console.log('🔍 TaskService - Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en getTasksByProject:', error);
      throw error;
    }
  }

  // Obtener tareas por desarrollador
  async getTasksByDeveloper(userId) {
    try {
      console.log('🔍 TaskService - getTasksByDeveloper - userId:', userId);
      console.log('🔍 TaskService - URL completa:', `${API_URL}/task/desarrollador/${userId}`);
      const response = await axios.get(`${API_URL}/task/desarrollador/${userId}`);
      console.log('🔍 TaskService - Respuesta del backend:', response.data);
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
      const url = `${API_URL}/task/${projectId}`;
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
      const response = await axios.patch(`${API_URL}/task/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error en updateTask:', error);
      throw error;
    }
  }

  // Eliminar tarea
  async deleteTask(taskId) {
    try {
      const response = await axios.delete(`${API_URL}/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteTask:', error);
      throw error;
    }
  }

  // Obtener tarea por ID
  async getTaskById(taskId) {
    try {
      const response = await axios.get(`${API_URL}/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getTaskById:', error);
      throw error;
    }
  }

  // Asignación automática de tareas por semana (usando el endpoint del backend)
  async asignarAutomaticoPorSemana(projectId) {
    try {
      console.log('🔍 TaskService - Llamando al endpoint de asignación automática para proyecto:', projectId);
      console.log('🔍 TaskService - URL completa:', `${API_URL}/task/asignar-automatico/${projectId}`);
      
      const response = await axios.post(`${API_URL}/task/asignar-automatico/${projectId}`);
      
      console.log('🔍 TaskService - Respuesta completa del backend:', response);
      console.log('🔍 TaskService - response.data:', response.data);
      console.log('🔍 TaskService - response.status:', response.status);
      console.log('🔍 TaskService - Tipo de response.data:', typeof response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error en asignarAutomaticoPorSemana:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  }
}

export default new TaskService(); 