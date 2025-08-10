
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/user'; // Assuming the backend is running on port 8080

class UserService {
  getUsers() {
    return axios.get(API_URL);
  }

  updateUser(id, user) {
    return axios.put(API_URL + `/${id}`, user);
  }

  deleteUser(id) {
    return axios.delete(API_URL + `/${id}`);
  }
  
  getUserById(id) {
    return axios.get(API_URL + `/${id}`);
  }
}

export default new UserService();
