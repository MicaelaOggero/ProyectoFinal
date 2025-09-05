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

    // ✅ Guardar token en localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response; // también podés devolver solo el user si querés
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
      
      // Asegurar que todos los campos necesarios estén presentes
      const completeProfileData = {
        dni: profileData.dni,
        rol: profileData.rol || 'user',
        aniosExperiencia: profileData.aniosExperiencia || 0,
        disponibilidadSemanal: profileData.disponibilidadSemanal || 40,
        costoPorHora: profileData.costoPorHora || 0,
        preferencias: profileData.preferencias || '',
        habilidades: profileData.habilidades || []
      };
      
      console.log('Datos completos a enviar:', completeProfileData);
      
      // Usar el endpoint /me para actualizar el perfil
      const response = await axios.put(`${API_URL}/me`, completeProfileData);
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
    const token = localStorage.getItem("token"); // ajusta según donde guardes el token
    console.log('token recuperado:', token);

const response = await axios.put(`${API_URL}/me`, profileData, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});


    if (response.data.usuario) {
      return response.data.usuario;
    }
    return null;
  } catch (error) {
    console.error('Error completo:', error);
    console.error('Respuesta del error:', error.response);
    throw error;
  }
}


  async createdWithGoogle() {
  try {
    const response = await axios.get(`${API_URL}/google-session`, { withCredentials: true });
    const { user, token } = response.data;

    // guardamos el token en localStorage para login normal
    localStorage.setItem("token", token);

    // actualizamos el estado global
    this.$root.currentUser = user;

    // redirigimos a la página principal
    this.$router.push("/");
  } catch (error) {
    console.error("Error obteniendo sesión Google:", error);
    this.$router.push("/login");
  }
}

async getCurrentUserGoogle() {
    try {
      const response = await axios.get(`${API_URL}/google-session`, {
        withCredentials: true,
      });

      const { user, token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
      }

      return { user, token };
    } catch (error) {
      console.error("Error en getCurrentUserGoogle:", error.response?.data || error.message);
      return null;
    }
  }



  async checkProfileCompletion() {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      withCredentials: true, // <-- permite enviar la cookie httpOnly del login Google
      headers: {
        Authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : undefined
      }
    });

    if (response.data.status === 'ok') {
      const user = response.data.payload;

      const isComplete = user.dni && 
                         user.habilidades && 
                         user.habilidades.length > 0;

      console.log('Verificación de perfil:', { 
        dni: !!user.dni, 
        habilidades: user.habilidades?.length > 0,
        isComplete 
      });

      return { isComplete, user };
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
      localStorage.clear();
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
  const token = localStorage.getItem("token");
  if (!token) return null; // no hay token, no hacemos la petición

  try {
    const response = await axios.get(`${API_URL}/profile` ,{ withCredentials: true }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.status === "ok") {
      return response.data.payload;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo usuario:", error.response?.data || error.message);
    return null;
  }
}


// Login + obtener usuario
async performLogin(email, password) {
  await this.login(email, password);
  return this.getCurrentUser();
}



  async checkSession() {
  try {
    const response = await axios.get(`${API_URL}/profile`);
    // Solo loguear en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Verificando sesión:', response.data);
    }

    if (response.data.status === 'ok') {
      // Devolver todos los campos del usuario
      return response.data.payload;
    }
    // No autenticado, devolver null sin error
    return null;
  } catch (error) {
    // Silenciar error y devolver null
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