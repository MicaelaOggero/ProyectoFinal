
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/project'; // Assuming the backend is running on port 8080

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
      fechaInicio: project.startDate,
      fechaFin: project.endDate,
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
      startDate: project.fechaInicio ? project.fechaInicio.split('T')[0] : '',
      endDate: project.fechaFin ? project.fechaFin.split('T')[0] : '',
      difficulty: difficultyMap[project.nivelDificultad] || 'Media',
      priority: priorityMap[project.prioridad] || 'Media',
      status: statusMap[project.estado] || 'Activo',
      team: project.equipo || [],
      fechaCreacion: project.fechaCreacion
    };
  }

  async getProjects() {
    try {
      const response = await axios.get(API_URL);
      // Mapear todos los proyectos del formato backend al frontend
      const mappedProjects = response.data.map(project => this._mapToFrontend(project));
      return { data: mappedProjects };
    } catch (error) {
      console.error('Error en getProjects:', error);
      throw error;
    }
  }

  async getProjectById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return { data: this._mapToFrontend(response.data) };
    } catch (error) {
      console.error('Error en getProjectById:', error);
      throw error;
    }
  }

  async createProject(project) {
    try {
      const backendProject = this._mapToBackend(project);
      const response = await axios.post(API_URL, backendProject);
      return response;
    } catch (error) {
      console.error('Error en createProject:', error);
      throw error;
    }
  }

  async updateProject(id, project) {
    try {
      const backendProject = this._mapToBackend(project);
      const response = await axios.put(API_URL + `/${id}`, backendProject);
      return response;
    } catch (error) {
      console.error('Error en updateProject:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const response = await axios.delete(API_URL + `/${id}`);
      return response;
    } catch (error) {
      console.error('Error en deleteProject:', error);
      throw error;
    }
  }
}

export default new ProjectService();
