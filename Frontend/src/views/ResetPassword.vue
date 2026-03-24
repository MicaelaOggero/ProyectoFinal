<template>
  <div class="reset-password-page">
    <div class="reset-card">
      <h1 class="title">Recuperar contraseña</h1>
      <p class="subtitle" v-if="!hasToken">
        Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <p class="subtitle" v-else>
        Ingresá tu nueva contraseña para completar el cambio.
      </p>

      <form v-if="!hasToken" @submit.prevent="handleRequestReset">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            class="form-control"
            required
            placeholder="tu@email.com"
          />
        </div>
        <button class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Enviando...' : 'Enviar enlace' }}
        </button>
      </form>

      <form v-else @submit.prevent="handleConfirmReset">
        <div class="form-group">
          <label for="password">Nueva contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            minlength="6"
            required
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-control"
            minlength="6"
            required
            placeholder="Repetí tu contraseña"
          />
        </div>

        <button class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </form>

      <p v-if="error" class="alert alert-danger">{{ error }}</p>
      <p v-if="successMessage" class="alert alert-success">{{ successMessage }}</p>

      <button class="btn-link" @click="$router.push('/login')">
        Volver al login
      </button>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/auth.service.js';

export default {
  name: 'ResetPasswordView',
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: '',
      successMessage: ''
    };
  },
  computed: {
    hasToken() {
      return Boolean(this.$route.query.token);
    }
  },
  methods: {
    async handleRequestReset() {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      try {
        await AuthService.requestPasswordReset(this.email);
        this.successMessage = 'Si el email existe, te enviamos un enlace para restablecer la contraseña.';
      } catch (error) {
        this.error = error.response?.data?.error || 'No se pudo enviar el email de recuperación.';
      } finally {
        this.loading = false;
      }
    },
    async handleConfirmReset() {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      try {
        if (this.password !== this.confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }

        const token = this.$route.query.token;
        await AuthService.confirmPasswordReset(token, this.password);
        this.successMessage = 'Contraseña actualizada. En unos segundos te redirigimos al login.';

        setTimeout(() => {
          this.$router.push('/login');
        }, 1800);
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'No se pudo restablecer la contraseña.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  padding: 1rem;
}

.reset-card {
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 6px 20px oklch(0 0 0 / 0.08);
}

.title {
  margin: 0;
  font-size: 1.4rem;
  color: var(--card-foreground);
}

.subtitle {
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
  color: var(--muted-foreground);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  min-height: 2.8rem;
  border: 1px solid var(--border);
  border-radius: 0.65rem;
  padding: 0.65rem 0.8rem;
  background: var(--login-input-bg);
  color: var(--card-foreground);
}

.btn {
  width: 100%;
  min-height: 2.8rem;
  border: none;
  border-radius: 0.65rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-link {
  margin-top: 1rem;
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

.alert {
  margin-top: 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.65rem;
  font-size: 0.9rem;
}

.alert-danger {
  background: color-mix(in oklch, var(--destructive) 12%, var(--card));
  color: var(--destructive);
  border: 1px solid color-mix(in oklch, var(--destructive) 35%, transparent);
}

.alert-success {
  background: color-mix(in oklch, oklch(0.65 0.15 145) 15%, var(--card));
  color: oklch(0.35 0.1 145);
  border: 1px solid color-mix(in oklch, oklch(0.65 0.15 145) 40%, transparent);
}
</style>
