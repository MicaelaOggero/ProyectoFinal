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

  // MÉTODOS DEPRECADOS - Usar preview/confirm en su lugar
  async runAutomaticAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/assignment/asignar-automatico/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignación automática:', error);
      throw error;
    }
  }

  async runAvailabilityBasedAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/assignment/asignar-automatico/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignación por disponibilidad:', error);
      throw error;
    }
  }

  async runCostBasedAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/assignment/asignar-costo/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignación por costo:', error);
      throw error;
    }
  }

  // NUEVOS MÉTODOS CON PREVIEW Y CONFIRM

  // Preview de asignación básica (por disponibilidad y habilidades)
  async previewBasicAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/preview/basica/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignación básica:', error);
      throw error;
    }
  }

  // Confirmar asignación básica
  async confirmBasicAssignment(projectId, asignaciones, costoTotalProyecto) {
    try {
      const response = await axios.post(`${API_URL}/assignment/confirm/basica/${projectId}`, {
        asignaciones,
        costoTotalProyecto
      });
      return response.data;
    } catch (error) {
      console.error('Error confirmando asignación básica:', error);
      throw error;
    }
  }

  // Preview de asignación por costo
  async previewCostAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/preview/costo/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignación por costo:', error);
      throw error;
    }
  }

  // Confirmar asignación por costo
  async confirmCostAssignment(projectId, asignaciones, costoTotalProyecto) {
    try {
      const response = await axios.post(`${API_URL}/assignment/confirm/costo/${projectId}`, {
        asignaciones,
        costoTotalProyecto
      });
      return response.data;
    } catch (error) {
      console.error('Error confirmando asignación por costo:', error);
      throw error;
    }
  }
}

export default new AssignmentService();
