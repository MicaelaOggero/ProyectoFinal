import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

// Configurar axios para incluir cookies en todas las requests
axios.defaults.withCredentials = true;

class AssignmentService {
  // Obtener asignaciones por proyecto
  async getAssignmentsByProject(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/proyecto/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      throw error;
    }
  }

  // Editar asignación existente
  async editAssignment(assignmentId, newDeveloperId) {
    try {
      const response = await axios.put(`${API_URL}/assignment/${assignmentId}`, {
        nuevoDevId: newDeveloperId
      });
      return response.data;
    } catch (error) {
      console.error('Error editando asignación:', error);
      throw error;
    }
  }

  // Ejecutar asignación automática (que retorna el resumen)
  async runAutomaticAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/tasks/asignar-automatico/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignación automática:', error);
      throw error;
    }
  }
}

export default new AssignmentService();