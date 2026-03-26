<template>
  <div class="login-page">
    <aside class="login-brand" aria-hidden="true">
      <div class="login-brand-gradient"></div>
      <div class="login-brand-inner">
        <div class="login-brand-header">
          <img
            :src="logoBrandUrl"
            alt="Smart Assistant"
            class="login-brand-logo-img"
            width="220"
            height="80"
          />
        </div>
        <div class="login-brand-body">
          <h1 class="login-brand-headline">Gestioná tus proyectos de forma inteligente</h1>
          <p class="login-brand-text">
            Controlá equipos, tareas y tiempos en una sola plataforma. Haz más con menos esfuerzo.
          </p>
          <div class="login-brand-stats">
            <div>
              <p class="login-stat-value">+500</p>
              <p class="login-stat-label">Proyectos activos</p>
            </div>
            <div class="login-stat-rule"></div>
            <div>
              <p class="login-stat-value">98%</p>
              <p class="login-stat-label">Satisfacción</p>
            </div>
            <div class="login-stat-rule"></div>
            <div>
              <p class="login-stat-value">24/7</p>
              <p class="login-stat-label">Soporte</p>
            </div>
          </div>
        </div>
        <p class="login-brand-footer">Todos los derechos reservados</p>
      </div>
    </aside>

    <div class="login-main">
      <div class="login-mobile-brand">
        <img
          :src="logoBrandUrl"
          alt="Smart Assistant"
          class="login-mobile-logo-img"
          width="200"
          height="72"
        />
      </div>

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
        <div class="auth-intro">
          <h2 class="auth-title">Bienvenido de nuevo</h2>
          <p class="auth-subtitle">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

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
            <span>o continúa con email</span>
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
          <div class="forgot-password-row">
            <button
              type="button"
              class="forgot-password-btn"
              @click="$router.push('/reset-password')"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>

      <!-- Contenido del Registro -->
      <div v-if="activeTab === 'register'" class="auth-content">
        <div class="auth-intro">
          <h2 class="auth-title">Crea tu cuenta</h2>
          <p class="auth-subtitle">Completa tus datos para registrarte en la plataforma</p>
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
                <label for="horasSemanalMaxima">Horas Semanales Máximas</label>
                <input
                  type="number"
                  id="horasSemanalMaxima"
                  v-model="registerData.horasSemanalMaxima"
                  class="form-control"
                  min="0"
                  max="168"
                />
              </div>
            </div>
          </div>

          <!-- Habilidades Técnicas -->
          <div class="form-group">
            <label>Habilidades Técnicas *</label>
            <div v-for="(skill, index) in registerData.habilidades" :key="index" class="skill-row mb-2">
              <div class="row">
                <div class="col-md-6">
                  <select 
                    class="form-control" 
                    v-model="skill.nombre"
                    required
                  >
                    <option disabled value="">Seleccione una habilidad</option>
                    <option v-for="opt in skillOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <select 
                    class="form-control" 
                    v-model="skill.nivel"
                    required
                  >
                    <option disabled value="">Nivel</option>
                    <option value="1">1 - Principiante</option>
                    <option value="2">2 - Básico</option>
                    <option value="3">3 - Intermedio</option>
                    <option value="4">4 - Avanzado</option>
                    <option value="5">5 - Experto</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-danger" 
                    @click="removeSkill(index)"
                    v-if="registerData.habilidades.length > 1"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-success mt-2" @click="addSkill">
              <i class="bi bi-plus-circle me-1"></i>Agregar Habilidad
            </button>
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
  </div>
</template>

<script>
import AuthService from '@/services/auth.service.js';
import SkillsService from '@/services/skills.service.js';
import logoBrandUrl from '@/assets/Group 1.png';

export default {
  name: 'LoginView',
  data() {
    return {
      logoBrandUrl,
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
        habilidades: [{ nombre: '', nivel: '' }],
        aniosExperiencia: 0,
        horasSemanalMaxima: 0,
        email: '',
        password: ''
      },
      skillOptions: []
    };
  },
  mounted() {
    this.loadSkills();
  },
  methods: {
    // Cargar habilidades desde el backend
    async loadSkills() {
      try {
        const response = await SkillsService.getSkills();
        // response.data ya es el array de habilidades directamente
        this.skillOptions = response.data.map(skill => skill.nombre);
      } catch (error) {
        console.error('Error loading skills:', error);
        // Fallback a opciones predefinidas si falla la carga
        this.skillOptions = ['JavaScript', 'Vue.js', 'Node.js', 'SQL', 'HTML & CSS', 'Python', 'Diseño UI'];
      }
    },
    
    // Agregar habilidad
    addSkill() {
      this.registerData.habilidades.push({ nombre: '', nivel: '' });
    },
    
    // Remover habilidad
    removeSkill(index) {
      if (this.registerData.habilidades.length > 1) {
        this.registerData.habilidades.splice(index, 1);
      }
    },
    async handleLogin() {
      this.loading = true;
      this.error = null;
      
      try {
        await AuthService.login(this.loginData.email, this.loginData.password);
        this.$router.push('/dashboard');
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
            !this.registerData.email || !this.registerData.password) {
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

        // Validar habilidades
        if (this.registerData.habilidades.length === 0) {
          throw new Error('Debes agregar al menos una habilidad');
        }

        for (let skill of this.registerData.habilidades) {
          if (!skill.nombre || !skill.nivel) {
            throw new Error('Por favor completa todas las habilidades (nombre y nivel)');
          }
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
        await AuthService.registerWithGoogle();
      } catch (error) {
        this.error = 'Error al iniciar registro con Google';
        this.loading = false;
      }
    },
    resetRegisterForm() {
      this.registerData = {
        dni: '',
        nombre: '',
        apellido: '',
        habilidades: [{ nombre: '', nivel: '' }],
        aniosExperiencia: 0,
        horasSemanalMaxima: 0,
        email: '',
        password: ''
      };
    }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: var(--card);
}

/* Panel izquierdo (referencia v0) */
.login-brand {
  display: none;
  position: relative;
  width: 50%;
  min-height: 100vh;
  overflow: hidden;
  background: var(--primary);
  color: var(--primary-foreground);
  align-self: stretch;
}

.login-brand-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 50%, oklch(0.55 0.18 255 / 0.4), transparent 70%),
    radial-gradient(circle at 70% 80%, oklch(0.62 0.2 160 / 0.3), transparent 60%);
  pointer-events: none;
}

.login-brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 3rem;
  text-align: center;
  box-sizing: border-box;
  /* Más aire entre logo / contenido / pie (como antes), bloque sigue centrado */
  gap: 3.5rem;
}

.login-brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.login-brand-logo-img {
  display: block;
  height: auto;
  max-height: 5rem;
  width: auto;
  max-width: min(100%, 18rem);
  object-fit: contain;
}

.login-brand-body {
  max-width: 28rem;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.login-brand-headline {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-wrap: balance;
  text-align: center;
}

.login-brand-text {
  margin-top: 0;
  font-size: 1.125rem;
  line-height: 1.6;
  color: color-mix(in oklch, var(--primary-foreground) 80%, transparent);
  text-align: center;
}

.login-brand-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.login-brand-stats > div {
  text-align: center;
  min-width: 0;
}

.login-stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1;
}

.login-stat-label {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: color-mix(in oklch, var(--primary-foreground) 70%, transparent);
}

.login-stat-rule {
  width: 1px;
  height: 3rem;
  background: color-mix(in oklch, var(--primary-foreground) 20%, transparent);
}

.login-brand-footer {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in oklch, var(--primary-foreground) 50%, transparent);
  text-align: center;
  width: 100%;
}

/* Columna derecha */
.login-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--card);
}

.login-mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.login-mobile-logo-img {
  display: block;
  height: auto;
  max-height: 4.5rem;
  width: auto;
  max-width: min(100%, 16rem);
  object-fit: contain;
}

.auth-container {
  width: 100%;
  max-width: 28rem;
  overflow: visible;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.auth-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: var(--muted);
  border: none;
}

.tab-button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.tab-button.active {
  background: var(--card);
  color: var(--card-foreground);
  box-shadow: 0 1px 2px oklch(0 0 0 / 0.06);
}

.tab-button:hover:not(.active) {
  color: var(--card-foreground);
}

.auth-content {
  padding: 2rem 0 0;
}

.auth-intro {
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--card-foreground);
}

.auth-subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.auth-options {
  margin-bottom: 0;
}

.btn-google {
  width: 100%;
  min-height: 3rem;
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.btn-google:hover:not(:disabled) {
  background: var(--muted);
  border-color: var(--border);
  box-shadow: 0 1px 3px oklch(0 0 0 / 0.06);
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
  background: var(--border);
}

.divider span {
  position: relative;
  background: var(--card);
  padding: 0 0.75rem;
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

.auth-form {
  margin-top: 0;
}

.forgot-password-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.25rem;
  margin-bottom: 0.75rem;
}

.forgot-password-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.forgot-password-btn:hover {
  opacity: 0.9;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--card-foreground);
  font-weight: 500;
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  font-size: 1rem;
  background: var(--login-input-bg);
  color: var(--card-foreground);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-control::placeholder {
  color: var(--muted-foreground);
}

.form-control:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 35%, transparent);
}

.btn {
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: color-mix(in oklch, var(--primary) 92%, var(--foreground));
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  font-weight: 500;
  font-size: 0.875rem;
}

.alert-danger {
  background: color-mix(in oklch, var(--destructive) 12%, var(--card));
  color: var(--destructive);
  border-color: color-mix(in oklch, var(--destructive) 35%, transparent);
}

.alert-success {
  background: color-mix(in oklch, oklch(0.65 0.15 145) 15%, var(--card));
  color: oklch(0.35 0.1 145);
  border-color: color-mix(in oklch, oklch(0.65 0.15 145) 40%, transparent);
}

.mt-3 {
  margin-top: 1rem;
}

.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.col-md-6,
.col-md-4,
.col-md-2 {
  flex: 1;
  min-width: 0;
}

.skill-row {
  background: color-mix(in oklch, var(--muted) 50%, transparent);
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
}

.auth-container .btn-sm {
  min-height: auto;
  width: auto;
  padding: 0.35rem 0.65rem;
  border-radius: 0.5rem;
}

.btn-success {
  background: oklch(0.55 0.15 145);
  color: oklch(0.99 0 0);
}

.btn-success:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 2px 8px oklch(0.55 0.15 145 / 0.35);
}

.auth-container .btn-danger {
  background: color-mix(in oklch, var(--destructive) 12%, var(--card));
  color: var(--destructive);
  border: 1px solid color-mix(in oklch, var(--destructive) 35%, transparent);
}

.auth-container .btn-danger:hover {
  background: color-mix(in oklch, var(--destructive) 18%, var(--card));
}

@media (min-width: 1024px) {
  .login-brand {
    display: flex;
    flex-direction: column;
  }

  .login-brand-inner {
    flex: 1 1 auto;
    min-height: min(100vh, 100%);
    justify-content: center;
  }

  .login-mobile-brand {
    display: none;
  }
}

@media (max-width: 768px) {
  .auth-content {
    padding-top: 1.5rem;
  }

  .row {
    flex-direction: column;
    gap: 0;
  }

  .col-md-6,
  .col-md-4,
  .col-md-2 {
    flex: none;
    width: 100%;
  }

  .login-brand-stats {
    flex-direction: column;
    align-items: center;
  }

  .login-stat-rule {
    display: none;
  }
}
</style>
