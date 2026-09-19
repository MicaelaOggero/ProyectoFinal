import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

axios.defaults.withCredentials = true;

class ReportService {
  async getWeeklyProjectReport(projectId, weekStart, weekEnd) {
    const response = await axios.get(`${API_URL}/report/weekly/project/${projectId}`, {
      params: { weekStart, weekEnd },
    });
    return response.data;
  }

  async getWeeklyDevelopersReport(projectId, weekStart, weekEnd) {
    const response = await axios.get(`${API_URL}/report/weekly/developers/${projectId}`, {
      params: { weekStart, weekEnd },
    });
    return response.data;
  }

  async getWeeklyTasksReport(projectId, weekStart, weekEnd) {
    const response = await axios.get(`${API_URL}/report/weekly/tasks/${projectId}`, {
      params: { weekStart, weekEnd },
    });
    return response.data;
  }

  async getFinalProjectReport(projectId) {
    const response = await axios.get(`${API_URL}/report/final/${projectId}`);
    return response.data;
  }
}

export default new ReportService();
