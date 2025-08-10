import axios from 'axios';

const API_URL = 'http://localhost:8080/api/session';

class AuthService {
  constructor() {
    // Configurar axios para incluir cookies en todas las requests
    axios.defaults.withCredentials = true;
  }

  async login(email, password) {
    try {
      console.log('Intentando login con:', { email, password: '***' });
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });
      console.log('Respuesta del login:', response.data);
      return response;
    } catch (error) {
      console.error('Error en login:', error.response?.data || error.message);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('Cerrando sesión...');
      const response = await axios.delete(`${API_URL}/logout`);
      console.log('Respuesta del logout:', response.data);
      return response;
    } catch (error) {
      console.error('Error en logout:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      console.log('Respuesta del profile:', response.data);
      if (response.data.status === 'ok') {
        return {
          nombre: response.data.payload.nombre,
          apellido: response.data.payload.apellido,
          rol: response.data.payload.rol,
          email: response.data.payload.email || 'N/A' // El backend no devuelve email en profile
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error.response?.data || error.message);
      return null;
    }
  }

  async checkSession() {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      console.log('Verificando sesión:', response.data);
      if (response.data.status === 'ok') {
        return {
          nombre: response.data.payload.nombre,
          apellido: response.data.payload.apellido,
          rol: response.data.payload.rol,
          email: response.data.payload.email || 'N/A'
        };
      }
      return null;
    } catch (error) {
      console.error('Error verificando sesión:', error.response?.status, error.response?.data);
      return null;
    }
  }

  // Método para verificar si el usuario es admin
  isAdmin(user) {
    return user && user.rol === 'admin';
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(user) {
    return user && (user.rol === 'user' || user.rol === 'admin');
  }
}

export default new AuthService();
