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
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/basica`);
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
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/costo`);
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

  // Preview de asignación por tiempo
  async previewTimeAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/tiempo`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignación por tiempo:', error);
      throw error;
    }
  }

  // Confirmar asignación por tiempo
  async confirmTimeAssignment(projectId, payload) {
    try {
      if (!payload) {
        throw new Error('No se recibieron sugerencias para confirmar (tiempo).');
      }

      const body = payload.success && payload.criterio && payload.sugerencias
        ? payload
        : {
            success: true,
            criterio: 'tiempo',
            sugerencias: payload
          };

      const response = await axios.post(`${API_URL}/assignment/iaconfirm/proyecto/${projectId}/tiempo`, body);
      return response.data;
    } catch (error) {
      console.error('Error confirmando asignación por tiempo:', error);
      throw error;
    }
  }

  // Preview de asignación por calidad
  async previewQualityAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/calidad`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignación por calidad:', error);
      throw error;
    }
  }

  // Confirmar asignación por calidad
  async confirmQualityAssignment(projectId, payload) {
    try {
      if (!payload) {
        throw new Error('No se recibieron sugerencias para confirmar (calidad).');
      }

      const body = payload.success && payload.criterio && payload.sugerencias
        ? payload
        : {
            success: true,
            criterio: 'calidad',
            sugerencias: payload
          };

      const response = await axios.post(`${API_URL}/assignment/iaconfirm/proyecto/${projectId}/calidad`, body);
      return response.data;
    } catch (error) {
      console.error('Error confirmando asignación por calidad:', error);
      throw error;
    }
  }

  // Asignar tarea manualmente (llama al endpoint si existe)
  async assignTaskManually(asignacion) {
    try {
      // Nota: Si no existe el endpoint, este método puede ser usado para preparar la asignación
      // y luego llamar a completar-manual
      const response = await axios.post(`${API_URL}/assignment/asignar-manual`, asignacion);
      return response.data;
    } catch (error) {
      // Si el endpoint no existe (404), retornamos null para que el frontend maneje la lógica
      if (error.response && error.response.status === 404) {
        console.warn('Endpoint de asignación manual no encontrado, se usará completar-manual');
        return null;
      }
      console.error('Error asignando tarea manualmente:', error);
      throw error;
    }
  }

  // Completar asignaciones manuales
  async completeManualAssignments(resultadoIA) {
    try {
      const response = await axios.post(`${API_URL}/assignment/completar-manual`, resultadoIA);
      return response.data;
    } catch (error) {
      console.error('Error completando asignaciones manuales:', error);
      throw error;
    }
  }
}

export default new AssignmentService();
