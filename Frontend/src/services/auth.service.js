import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api/session';

class AuthService {
  constructor() {
    // Configurar axios para incluir cookies en todas las requests
    axios.defaults.withCredentials = true;
  }

  async register(userData) {
    try {
      console.log('Intentando registro con:', { ...userData, password: '***' });
      const response = await axios.post(`${API_URL}/register`, userData);
      console.log('Respuesta del registro:', response.data);
      return response;
    } catch (error) {
      console.error('Error en registro:', error.response?.data || error.message);
      throw error;
    }
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

  // Método para iniciar autenticación con Google
  async loginWithGoogle() {
    try {
      // Redirigir al usuario a la ruta de autenticación de Google
      window.location.href = `${API_URL}/auth/google`;
    } catch (error) {
      console.error('Error al iniciar autenticación con Google:', error);
      throw error;
    }
  }

  // Método para completar perfil después de Google OAuth
  async completeGoogleProfile(profileData) {
    try {
      console.log('Completando perfil de Google con:', profileData);
      const response = await axios.put(`${API_URL}/me`, profileData);
      console.log('Perfil completado:', response.data);
      return response;
    } catch (error) {
      console.error('Error al completar perfil:', error.response?.data || error.message);
      throw error;
    }
  }

  // Método para actualizar el perfil del usuario
  async updateProfile(profileData) {
    try {
      console.log('Actualizando perfil con:', profileData);
      console.log('URL de la API:', `${API_URL}/me`);
      console.log('Configuración de axios:', axios.defaults);
      
      const response = await axios.put(`${API_URL}/me`, profileData);
      console.log('Respuesta del servidor:', response);
      console.log('Datos de la respuesta:', response.data);
      
      // El backend devuelve { message: "...", usuario: ... }
      if (response.data.usuario) {
        return response.data.usuario;
      }
      return null;
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del error:', error.response);
      console.error('Estado del error:', error.response?.status);
      console.error('Datos del error:', error.response?.data);
      throw error;
    }
  }

  // Método para verificar si el usuario necesita completar su perfil
  async checkProfileCompletion() {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      if (response.data.status === 'ok') {
        const user = response.data.payload;
        
        // Verificar si el perfil está completo basándose en los datos del usuario
        const isComplete = user.dni && 
                          user.nombre && 
                          user.apellido && 
                          user.habilidades && 
                          user.habilidades.length > 0;
        
        return { isComplete, user }; // También devolver el usuario completo
      }
      return { isComplete: false, user: null };
    } catch (error) {
      console.error('Error verificando completitud del perfil:', error);
      return { isComplete: false, user: null };
    }
  }

  // Método para obtener usuarios pendientes de aprobación (solo admin)
  async getPendingUsers() {
    try {
      const response = await axios.get(`${API_URL}/pending-users`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo usuarios pendientes:', error);
      throw error;
    }
  }

  // Método para aprobar un usuario (solo admin)
  async approveUser(userId) {
    try {
      const response = await axios.put(`${API_URL}/approve-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error aprobando usuario:', error);
      throw error;
    }
  }

  // Método para rechazar un usuario (solo admin)
  async rejectUser(userId) {
    try {
      const response = await axios.put(`${API_URL}/reject-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error rechazando usuario:', error);
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
        // Devolver todos los campos del usuario, no solo los básicos
        return response.data.payload;
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
        // Devolver todos los campos del usuario, no solo los básicos
        return response.data.payload;
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
