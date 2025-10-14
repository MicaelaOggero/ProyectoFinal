
import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

// Configurar axios para incluir cookies en todas las requests
axios.defaults.withCredentials = true;

class ProjectService {
  // Mapear campos del frontend al backend
  _mapToBackend(project) {
    const difficultyMap = {
      'Baja': 1,
      'Media': 3,
      'Alta': 5
    };
    
    const statusMap = {
      'Activo': 'activo',
      'Pausado': 'pausado', 
      'Finalizado': 'finalizado'
    };

    const priorityMap = {
      'Baja': 'baja',
      'Media': 'media',
      'Alta': 'alta'
    };

    return {
      nombre: project.name,
      descripcion: project.description,
      fechaInicioEstimada: project.startDate,
      fechaFinEstimada: project.endDate,
      nivelDificultad: difficultyMap[project.difficulty] || 3,
      prioridad: priorityMap[project.priority] || 'media',
      estado: statusMap[project.status] || 'activo',
      equipo: project.team || []
    };
  }

  // Mapear campos del backend al frontend
  _mapToFrontend(project) {
    const difficultyMap = {
      1: 'Baja',
      2: 'Baja',
      3: 'Media',
      4: 'Alta',
      5: 'Alta'
    };
    
    const statusMap = {
      'activo': 'Activo',
      'pausado': 'Pausado',
      'finalizado': 'Finalizado'
    };

    const priorityMap = {
      'baja': 'Baja',
      'media': 'Media',
      'alta': 'Alta'
    };

    return {
      _id: project._id,
      name: project.nombre,
      description: project.descripcion,
      startDate: project.fechaInicioEstimada ? project.fechaInicioEstimada.split('T')[0] : '',
      endDate: project.fechaFinEstimada ? project.fechaFinEstimada.split('T')[0] : '',
      difficulty: difficultyMap[project.nivelDificultad] || 'Media',
      priority: priorityMap[project.prioridad] || 'Media',
      status: statusMap[project.estado] || 'Activo',
      team: project.equipo || [],
      fechaCreacion: project.fechaCreacion
    };
  }

  async getProjects() {
    try {
      console.log('🔍 ProjectService - getProjects - API_URL:', API_URL);
      console.log('🔍 ProjectService - URL completa:', `${API_URL}/project`);
      const response = await axios.get(`${API_URL}/project`);
      console.log('🔍 ProjectService - Respuesta del backend:', response.data);
      console.log('🔍 ProjectService - Cantidad de proyectos:', response.data.length);
      // Mapear todos los proyectos del formato backend al frontend
      const mappedProjects = response.data.map(project => this._mapToFrontend(project));
      console.log('🔍 ProjectService - Proyectos mapeados:', mappedProjects);
      return { data: mappedProjects };
    } catch (error) {
      console.error('Error en getProjects:', error);
      throw error;
    }
  }

  async getProjectById(id) {
    try {
      console.log('🔍 ProjectService - getProjectById - ID:', id);
      console.log('🔍 ProjectService - URL completa:', `${API_URL}/project/${id}`);
      const response = await axios.get(`${API_URL}/project/${id}`);
      console.log('🔍 ProjectService - Proyecto recibido:', response.data);
      return { data: this._mapToFrontend(response.data) };
    } catch (error) {
      console.error('Error en getProjectById:', error);
      throw error;
    }
  }

  async createProject(project) {
    try {
      const backendProject = this._mapToBackend(project);
      const response = await axios.post(`${API_URL}/project`, backendProject);
      return response;
    } catch (error) {
      console.error('Error en createProject:', error);
      throw error;
    }
  }

  async updateProject(id, project) {
    try {
      const backendProject = this._mapToBackend(project);
      const response = await axios.put(`${API_URL}/project/${id}`, backendProject);
      return response;
    } catch (error) {
      console.error('Error en updateProject:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const response = await axios.delete(`${API_URL}/project/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteProject:', error);
      throw error;
    }
  }
}

export default new ProjectService();
