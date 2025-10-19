import axios from 'axios';

const API_URL = 'http://localhost:8080/api/skill';

class SkillsService {
  async getSkills() {
    try {
      const response = await axios.get(API_URL);
      return { data: response.data }; // El backend devuelve directamente el array
    } catch (error) {
      console.error('Error obteniendo habilidades:', error);
      throw error;
    }
  }
}

export default new SkillsService(); 