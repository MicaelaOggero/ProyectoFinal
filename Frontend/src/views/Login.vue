<template>
  <div class="login-main-wrapper">
    <div class="login-illustration">
      <div class="motivational-phrase">El orden no empieza en el código, empieza en la gestión.</div>
      <!-- Ilustración SVG genérica -->
      <svg width="320" height="320" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="320" rx="32" fill="#E6F0FA"/>
        <circle cx="160" cy="160" r="80" fill="#90CAF9"/>
        <rect x="110" y="140" width="100" height="60" rx="12" fill="#fff"/>
        <rect x="130" y="160" width="60" height="10" rx="5" fill="#90CAF9"/>
        <rect x="130" y="175" width="60" height="10" rx="5" fill="#90CAF9"/>
        <circle cx="160" cy="130" r="18" fill="#fff"/>
        <circle cx="160" cy="130" r="10" fill="#90CAF9"/>
      </svg>
    </div>
    <div class="login-form-section">
      <div class="login-card">
        <h2 class="login-title">¡Hola!</h2>
        <p class="login-subtitle">Inicia sesión para continuar</p>
        <form @submit.prevent="handleLogin">
          <div class="login-input-group">
            <input type="email" placeholder="Correo electrónico" v-model="email" required class="input-rounded" />
          </div>
          <div class="login-input-group">
            <input type="password" placeholder="Contraseña" v-model="password" required class="input-rounded" />
          </div>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
          <button type="submit" class="btn-primary">Ingresar</button>
        </form>
        <div class="login-forgot">
          <a href="#" class="link-primary">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SessionService from '@/services/session.service.js';

export default {
  name: 'LoginView',
  data() {
    return {
      email: 'correo-prueba@gmail.com',
      password: '123456',
      error: null
    };
  },
  methods: {
    handleLogin() {
      this.error = null;
      SessionService.login({ email: this.email, password: this.password })
        .then(() => {
          this.$router.push('/dashboard');
        })
        .catch(error => {
          this.error = error.response ? error.response.data.error : 'An unexpected error occurred.';
          console.error('Login failed:', this.error);
        });
    }
  }
}
</script>

<style scoped>
.login-main-wrapper {
  display: flex;
  min-height: 100vh;
}

.login-illustration {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0076F9;
  position: relative;
  overflow: hidden;
}

.login-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 2.5rem 2rem 2rem 2rem;
  width: 100%;
  max-width: 370px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #222;
  text-align: center;
}

.login-subtitle {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.login-input-group {
  width: 100%;
  margin-bottom: 1.2rem;
}

.login-input-group input {
  width: 100%;
  padding: 0.9rem 1.1rem;
  border: 1px solid #e0e0e0;
  border-radius: 30px;
  font-size: 1rem;
  outline: none;
  background: #f7f7f7;
  transition: border 0.2s;
}

.login-input-group input:focus {
  border: 1.5px solid #0076F9;
  background: #fff;
}

.login-btn {
  width: 100%;
  padding: 0.9rem 0;
  background: #0076F9;
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #005bb5;
}

.login-forgot {
  width: 100%;
  text-align: right;
}

.login-forgot a {
  color: #0076F9;
  font-size: 0.95rem;
  text-decoration: none;
  transition: text-decoration 0.2s;
}

.login-forgot a:hover {
  text-decoration: underline;
}

.motivational-phrase {
  width: 100%;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0076F9;
  margin-bottom: 2.5rem;
  animation: bounceIn 1.2s cubic-bezier(.68,-0.55,.27,1.55);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(20px) scale(1.05);
  }
  80% {
    transform: translateY(-8px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
