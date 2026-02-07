
import axios from 'axios';

const API_URL = (process.env.VUE_APP_API_URL || 'http://localhost:8080/api') + '/session';

class SessionService {
  register(user) {
    return axios.post(API_URL + '/register', user);
  }

  login(credentials) {
    return axios.post(API_URL + '/login', credentials);
  }

  logout() {
    return axios.delete(API_URL + '/logout');
  }

  getProfile() {
    return axios.get(API_URL + '/profile');
  }
}

export default new SessionService();
