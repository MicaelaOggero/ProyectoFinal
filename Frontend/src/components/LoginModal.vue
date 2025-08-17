<template>
  <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="loginModalLabel">Iniciar Sesión</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>
          
          <!-- Opciones de inicio de sesión -->
          <div class="row mb-4">
            <div class="col-12">
              <h6 class="text-center mb-3">Elige tu método de inicio de sesión:</h6>
              <div class="d-grid gap-2">
                <button 
                  @click="showGoogleAuth" 
                  class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                  :disabled="loading"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>
                <div class="text-center">
                  <span class="text-muted">o</span>
                </div>
                <button 
                  @click="showTraditionalForm = true" 
                  class="btn btn-primary"
                  :disabled="loading"
                >
                  Iniciar Sesión con Email
                </button>
              </div>
            </div>
          </div>

          <!-- Formulario de login tradicional -->
          <div v-if="showTraditionalForm">
            <hr>
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input 
                  type="email" 
                  class="form-control" 
                  id="email" 
                  v-model="credentials.email" 
                  required
                >
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Contraseña</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="password" 
                  v-model="credentials.password" 
                  required
                >
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Iniciar Sesión
                </button>
              </div>
            </form>
          </div>

          <!-- Enlace al registro -->
          <div class="text-center mt-3">
            <p class="mb-0">¿No tienes una cuenta?</p>
            <button 
              @click="showRegister" 
              class="btn btn-link p-0"
              type="button"
            >
              Regístrate aquí
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'LoginModal',
  data() {
    return {
      modalInstance: null,
      showTraditionalForm: false,
      credentials: {
        email: '',
        password: ''
      },
      errorMessage: '',
      loading: false
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('loginModal'));
  },
  methods: {
    show() {
      this.errorMessage = '';
      this.credentials = { email: '', password: '' };
      this.showTraditionalForm = false;
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    showRegister() {
      this.closeModal();
      this.$emit('show-register');
    },
    async handleLogin() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        await AuthService.login(this.credentials.email, this.credentials.password);
        this.$emit('login-success');
        this.closeModal();
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
      } finally {
        this.loading = false;
      }
    },
    async showGoogleAuth() {
      try {
        this.loading = true;
        await AuthService.loginWithGoogle();
      } catch (error) {
        this.errorMessage = 'Error al iniciar autenticación con Google';
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.btn-outline-primary:hover {
  background-color: #4285F4;
  border-color: #4285F4;
  color: white;
}

.btn-outline-primary:hover svg {
  filter: brightness(0) invert(1);
}

.btn-link {
  color: #0d6efd;
  text-decoration: none;
}

.btn-link:hover {
  color: #0a58ca;
  text-decoration: underline;
}
</style>
