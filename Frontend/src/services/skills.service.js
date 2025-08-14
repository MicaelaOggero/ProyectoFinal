import axios from 'axios';

const API_URL = 'http://localhost:8080/api/skill';

class SkillsService {
  getSkills() {
    return axios.get(API_URL);
  }
}

export default new SkillsService(); 