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

  // Editar asignaci?n existente
  async editAssignment(assignmentId, newDeveloperId) {
    try {
      const response = await axios.put(`${API_URL}/assignment/${assignmentId}`, {
        nuevoDevId: newDeveloperId
      });
      return response.data;
    } catch (error) {
      console.error('Error editando asignaci?n:', error);
      throw error;
    }
  }

  // MÿÿTODOS DEPRECADOS - Usar preview/confirm en su lugar
  async runAutomaticAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/assignment/asignar-automatico/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignaci?n autom?tica:', error);
      throw error;
    }
  }

  async runAvailabilityBasedAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/assignment/asignar-automatico/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignaci?n por disponibilidad:', error);
      throw error;
    }
  }

  async runCostBasedAssignment(projectId) {
    try {
      const response = await axios.post(`${API_URL}/assignment/asignar-costo/${projectId}`, {});
      return response.data;
    } catch (error) {
      console.error('Error ejecutando asignaci?n por costo:', error);
      throw error;
    }
  }

  // NUEVOS MÿÿTODOS CON PREVIEW Y CONFIRM

  // Preview de asignaci?n b?sica (por disponibilidad y habilidades)
  async previewBasicAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/basica`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignaci?n b?sica:', error);
      throw error;
    }
  }

  // Confirmar asignaci?n b?sica
  async confirmBasicAssignment(projectId, payload) {
    try {
      // El payload debe incluir: projectId, asignaciones, costoTotalSimulado, tiempoTotalEstimado, tiempoTotalSimulado, calidadPromedioTareas, calidadPromedioSimulado
      const response = await axios.post(`${API_URL}/assignment/iaconfirm/proyecto/${projectId}/basica`, payload);
      return response.data;
    } catch (error) {
      console.error('Error confirmando asignaci?n b?sica:', error);
      throw error;
    }
  }

  // Preview de asignaci?n por costo
  async previewCostAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/costo`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignaci?n por costo:', error);
      throw error;
    }
  }

  // Confirmar asignaci?n por costo
  async confirmCostAssignment(projectId, payload) {
    try {
      // El payload debe incluir: projectId, asignaciones, costoTotalSimulado, tiempoTotalEstimado, tiempoTotalSimulado, calidadPromedioTareas, calidadPromedioSimulado
      const response = await axios.post(`${API_URL}/assignment/iaconfirm/proyecto/${projectId}/costo`, payload);
      return response.data;
    } catch (error) {
      console.error('Error confirmando asignaci?n por costo:', error);
      throw error;
    }
  }

  // Preview de asignaci?n por tiempo
  async previewTimeAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/tiempo`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignaci?n por tiempo:', error);
      throw error;
    }
  }

  // Confirmar asignaci?n por tiempo
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
      console.error('Error confirmando asignaci?n por tiempo:', error);
      throw error;
    }
  }

  // Preview de asignaci?n por calidad
  async previewQualityAssignment(projectId) {
    try {
      const response = await axios.get(`${API_URL}/assignment/iapreview/proyecto/${projectId}/calidad`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preview de asignaci?n por calidad:', error);
      throw error;
    }
  }

  // Confirmar asignaci?n por calidad
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
      console.error('Error confirmando asignaci?n por calidad:', error);
      throw error;
    }
  }

  // Asignar tarea manualmente (llama al endpoint si existe)
  async assignTaskManually(asignacion) {
    try {
      // Nota: Si no existe el endpoint, este m?todo puede ser usado para preparar la asignaci?n
      // y luego llamar a completar-manual
      const response = await axios.post(`${API_URL}/assignment/asignar-manual`, asignacion);
      return response.data;
    } catch (error) {
      // Si el endpoint no existe (404), retornamos null para que el frontend maneje la l?gica
      if (error.response && error.response.status === 404) {
        console.warn('Endpoint de asignaci?n manual no encontrado, se usar? completar-manual');
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

  // NUEVOS MÿÿTODOS PARA SIMULACIÿÿN DE ASIGNACIONES

  // Obtener resumen de simulaci?n con los 4 criterios (basica, costo, tiempoIA, calidad)
  async getResumenSimulacion(projectId) {
    try {
      const response = await axios.get(`${API_URL}/simulation-assignment/resumen-simulacion/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen de simulaci?n:', error);
      throw error;
    }
  }

  // Verificar disponibilidad de asignaciones manuales
  async verificarDisponibilidadAsignacionesManuales(asignacionesManuales) {
    try {
      const response = await axios.post(
        `${API_URL}/simulation-assignment/asignaciones-manuales/verificar-disponibilidad-acumulada`,
        asignacionesManuales
      );
      return response.data;
    } catch (error) {
      console.error('Error verificando disponibilidad de asignaciones manuales:', error);
      throw error;
    }
  }

  // Aplicar asignaciones manuales al resumen completo
  async aplicarAsignacionesManuales(resumenCompleto) {
    try {
      const response = await axios.post(
        `${API_URL}/simulation-assignment/aplicar-asignaciones-manuales`,
        resumenCompleto
      );
      return response.data;
    } catch (error) {
      console.error('Error aplicando asignaciones manuales:', error);
      throw error;
    }
  }
}

export default new AssignmentService();
