<template>
  <div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="registerModalLabel">Registro de Usuario</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="alert alert-success" role="alert">
            {{ successMessage }}
          </div>

          <!-- Opciones de registro -->
          <div class="row mb-4">
            <div class="col-12">
              <h6 class="text-center mb-3">Elige tu método de registro:</h6>
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
                  Registrarse con Email
                </button>
              </div>
            </div>
          </div>

          <!-- Formulario de registro tradicional -->
          <div v-if="showTraditionalForm">
            <hr>
            <h6 class="mb-3">Información Personal</h6>
            <form @submit.prevent="handleRegister">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="dni" class="form-label">DNI *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="dni" 
                    v-model="userData.dni" 
                    required
                    maxlength="8"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="rol" class="form-label">Rol *</label>
                  <select class="form-select" id="rol" v-model="userData.rol" required>
                    <option value="">Selecciona un rol</option>
                    <option value="desarrollador">Desarrollador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="nombre" class="form-label">Nombre *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="nombre" 
                    v-model="userData.nombre" 
                    required
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="apellido" class="form-label">Apellido *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="apellido" 
                    v-model="userData.apellido" 
                    required
                  >
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="email" class="form-label">Email *</label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="email" 
                    v-model="userData.email" 
                    required
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="password" class="form-label">Contraseña *</label>
                  <input 
                    type="password" 
                    class="form-control" 
                    id="password" 
                    v-model="userData.password" 
                    required
                    minlength="6"
                  >
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="aniosExperiencia" class="form-label">Años de Experiencia</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="aniosExperiencia" 
                    v-model="userData.aniosExperiencia" 
                    min="0"
                    max="50"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="disponibilidadSemanal" class="form-label">Disponibilidad Semanal (horas)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="disponibilidadSemanal" 
                    v-model="userData.disponibilidadSemanal" 
                    min="0"
                    max="168"
                  >
                </div>
              </div>

              <div class="mb-3">
                <label for="costoPorHora" class="form-label">Costo por Hora ($)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="costoPorHora" 
                  v-model="userData.costoPorHora" 
                  min="0"
                  step="0.01"
                >
              </div>

              <div class="mb-3">
                <label for="preferencias" class="form-label">Preferencias de Trabajo</label>
                <textarea 
                  class="form-control" 
                  id="preferencias" 
                  v-model="userData.preferencias" 
                  rows="3"
                  placeholder="Describe tus preferencias de trabajo..."
                ></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Registrarse
                </button>
              </div>
            </form>
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
  name: 'RegisterModal',
  data() {
    return {
      modalInstance: null,
      showTraditionalForm: false,
      userData: {
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
      },
      errorMessage: '',
      successMessage: '',
      loading: false
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('registerModal'));
  },
  methods: {
    show() {
      this.errorMessage = '';
      this.successMessage = '';
      this.showTraditionalForm = false;
      this.resetForm();
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
      this.resetForm();
    },
    resetForm() {
      this.userData = {
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
      this.showTraditionalForm = false;
    },
    async handleRegister() {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      try {
        // Validar campos requeridos
        if (!this.userData.dni || !this.userData.nombre || !this.userData.apellido || 
            !this.userData.rol || !this.userData.email || !this.userData.password) {
          throw new Error('Por favor completa todos los campos requeridos');
        }

        // Validar DNI
        if (this.userData.dni.length !== 8 || isNaN(this.userData.dni)) {
          throw new Error('El DNI debe tener 8 dígitos numéricos');
        }

        // Validar contraseña
        if (this.userData.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        await AuthService.register(this.userData);
        this.successMessage = '¡Usuario registrado exitosamente! Ya puedes iniciar sesión.';
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          this.closeModal();
          this.$emit('register-success');
        }, 2000);
        
      } catch (error) {
        this.errorMessage = error.response?.data?.error || error.message || 'Error al registrar usuario';
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
.modal-lg {
  max-width: 800px;
}

.btn-outline-primary:hover {
  background-color: #4285F4;
  border-color: #4285F4;
  color: white;
}

.btn-outline-primary:hover svg {
  filter: brightness(0) invert(1);
}
</style>
