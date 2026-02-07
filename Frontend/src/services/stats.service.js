import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

// Configurar axios para incluir cookies en todas las requests
axios.defaults.withCredentials = true;

class StatsService {
  // Obtener estadísticas de tareas completadas
  async getCompletedTasksStats() {
    try {
      const response = await axios.get(`${API_URL}/task/`);
      const tasks = response.data;
      
      // Contar tareas completadas
      const completedTasks = tasks.filter(task => task.estado === 'completada').length;
      
      return {
        total: tasks.length,
        completed: completedTasks,
        pending: tasks.filter(task => task.estado === 'pendiente').length,
        inProgress: tasks.filter(task => task.estado === 'en curso').length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de tareas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de horas trabajadas
  async getHoursStats() {
    try {
      const response = await axios.get(`${API_URL}/task/`);
      const tasks = response.data;
      
      // Sumar todas las horas invertidas
      const totalHoursWorked = tasks.reduce((total, task) => {
        return total + (task.tiempoInvertidoHoras || 0);
      }, 0);
      
      return {
        totalHoursWorked,
        totalTasks: tasks.length,
        averageHoursPerTask: tasks.length > 0 ? (totalHoursWorked / tasks.length).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de horas:', error);
      throw error;
    }
  }

  // Obtener estadísticas generales del dashboard
  async getDashboardStats() {
    try {
      const [tasksStats, hoursStats] = await Promise.all([
        this.getCompletedTasksStats(),
        this.getHoursStats()
      ]);

      return {
        tasks: tasksStats,
        hours: hoursStats
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      throw error;
    }
  }
}

export default new StatsService();
