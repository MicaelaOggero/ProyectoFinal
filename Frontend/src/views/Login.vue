<template>
  <div class="login-container">
    <div class="auth-container">
      <!-- Tabs para alternar entre Login y Registro -->
      <div class="auth-tabs">
        <button 
          @click="activeTab = 'login'" 
          :class="['tab-button', { active: activeTab === 'login' }]"
        >
          Iniciar Sesión
        </button>
        <button 
          @click="activeTab = 'register'" 
          :class="['tab-button', { active: activeTab === 'register' }]"
        >
          Registrarse
        </button>
      </div>

      <!-- Contenido del Login -->
      <div v-if="activeTab === 'login'" class="auth-content">
        
        <!-- Opciones de inicio de sesión -->
        <div class="auth-options">
          <button 
            @click="loginWithGoogle" 
            class="btn btn-google"
            :disabled="loading"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" class="google-icon">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
          
          <div class="divider">
            <span>o</span>
          </div>
        </div>

        <!-- Formulario de login tradicional -->
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-email">Email:</label>
            <input
              type="email"
              id="login-email"
              v-model="loginData.email"
              required
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="login-password">Contraseña:</label>
            <input
              type="password"
              id="login-password"
              v-model="loginData.password"
              required
              class="form-control"
            />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>

      <!-- Contenido del Registro -->
      <div v-if="activeTab === 'register'" class="auth-content">
        <h2>Registrarse</h2>
        
        <!-- Opciones de registro -->
        <div class="auth-options">
          <button 
            @click="registerWithGoogle" 
            class="btn btn-google"
            :disabled="loading"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" class="google-icon">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registrarse con Google
          </button>
          
          <div class="divider">
            <span>o</span>
          </div>
        </div>

        <!-- Formulario de registro tradicional -->
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="dni">DNI *</label>
                <input
                  type="text"
                  id="dni"
                  v-model="registerData.dni"
                  required
                  class="form-control"
                  maxlength="8"
                />
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="rol">Rol *</label>
                <select id="rol" v-model="registerData.rol" required class="form-control">
                  <option value="">Selecciona un rol</option>
                  <option value="desarrollador">Desarrollador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  v-model="registerData.nombre"
                  required
                  class="form-control"
                />
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="apellido">Apellido *</label>
                <input
                  type="text"
                  id="apellido"
                  v-model="registerData.apellido"
                  required
                  class="form-control"
                />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  v-model="registerData.email"
                  required
                  class="form-control"
                />
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="password">Contraseña *</label>
                <input
                  type="password"
                  id="password"
                  v-model="registerData.password"
                  required
                  class="form-control"
                  minlength="6"
                />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="aniosExperiencia">Años de Experiencia</label>
                <input
                  type="number"
                  id="aniosExperiencia"
                  v-model="registerData.aniosExperiencia"
                  class="form-control"
                  min="0"
                  max="50"
                />
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="disponibilidadSemanal">Disponibilidad Semanal (horas)</label>
                <input
                  type="number"
                  id="disponibilidadSemanal"
                  v-model="registerData.disponibilidadSemanal"
                  class="form-control"
                  min="0"
                  max="168"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="costoPorHora">Costo por Hora ($)</label>
            <input
              type="number"
              id="costoPorHora"
              v-model="registerData.costoPorHora"
              class="form-control"
              min="0"
              step="0.01"
            />
          </div>

          <div class="form-group">
            <label for="preferencias">Preferencias de Trabajo</label>
            <textarea
              id="preferencias"
              v-model="registerData.preferencias"
              class="form-control"
              rows="3"
              placeholder="Describe tus preferencias de trabajo..."
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Registrando...' : 'Registrarse' }}
          </button>
        </form>
      </div>

      <!-- Mensajes de error y éxito -->
      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>
      <div v-if="successMessage" class="alert alert-success mt-3">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/auth.service.js';

export default {
  name: 'LoginView',
  data() {
    return {
      activeTab: 'login',
      loading: false,
      error: null,
      successMessage: '',
      loginData: {
        email: '',
        password: ''
      },
      registerData: {
        dni: '',
        nombre: '',
        apellido: '',
        rol: '',
        habilidades: [],
        aniosExperiencia: 0,
        disponibilidadSemanal: 0,
        preferencias: '',
        costoPorHora: 0,
        email: '',
        password: ''
      }
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = null;
      
      try {
        await AuthService.login(this.loginData.email, this.loginData.password);
        this.$router.push('/proyectos');
      } catch (error) {
        this.error = error.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
      } finally {
        this.loading = false;
      }
    },
    async handleRegister() {
      this.loading = true;
      this.error = null;
      this.successMessage = '';
      
      try {
        // Validar campos requeridos
        if (!this.registerData.dni || !this.registerData.nombre || !this.registerData.apellido || 
            !this.registerData.rol || !this.registerData.email || !this.registerData.password) {
          throw new Error('Por favor completa todos los campos requeridos');
        }

        // Validar DNI
        if (this.registerData.dni.length !== 8 || isNaN(this.registerData.dni)) {
          throw new Error('El DNI debe tener 8 dígitos numéricos');
        }

        // Validar contraseña
        if (this.registerData.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        await AuthService.register(this.registerData);
        this.successMessage = '¡Usuario registrado exitosamente! Ya puedes iniciar sesión.';
        
        // Cambiar a la pestaña de login después de 2 segundos
        setTimeout(() => {
          this.activeTab = 'login';
          this.successMessage = '';
          this.resetRegisterForm();
        }, 2000);
        
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Error al registrar usuario';
      } finally {
        this.loading = false;
      }
    },
    async loginWithGoogle() {
      try {
        this.loading = true;
        await AuthService.loginWithGoogle();
      } catch (error) {
        this.error = 'Error al iniciar autenticación con Google';
        this.loading = false;
      }
    },
    async registerWithGoogle() {
      try {
        this.loading = true;
        await AuthService.loginWithGoogle();
      } catch (error) {
        this.error = 'Error al iniciar autenticación con Google';
        this.loading = false;
      }
    },
    resetRegisterForm() {
      this.registerData = {
        dni: '',
        nombre: '',
        apellido: '',
        rol: '',
        habilidades: [],
        aniosExperiencia: 0,
        disponibilidadSemanal: 0,
        preferencias: '',
        costoPorHora: 0,
        email: '',
        password: ''
      };
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.auth-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  font-size: 1.1rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: white;
  color: #007bff;
  border-bottom: 3px solid #007bff;
}

.tab-button:hover:not(.active) {
  background: #e9ecef;
  color: #495057;
}

.auth-content {
  padding: 2rem;
}

.auth-content h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 700;
}

.auth-options {
  margin-bottom: 2rem;
}

.btn-google {
  width: 100%;
  background: white;
  color: #333;
  border: 2px solid #dee2e6;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-google:hover {
  border-color: #4285F4;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
}

.google-icon {
  flex-shrink: 0;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #dee2e6;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.auth-form {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
}

.mt-3 {
  margin-top: 1rem;
}

.row {
  display: flex;
  gap: 1rem;
}

.col-md-6 {
  flex: 1;
}

@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .auth-container {
    max-width: 100%;
  }
  
  .auth-content {
    padding: 1.5rem;
  }
  
  .row {
    flex-direction: column;
    gap: 0;
  }
  
  .col-md-6 {
    flex: none;
  }
}
</style>
