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
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    async handleLogin() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        await AuthService.login(this.credentials.email, this.credentials.password);
        this.$emit('login-success');
        this.closeModal();
      } catch (error) {
        this.errorMessage = error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
