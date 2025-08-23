<template>
  <div class="callback-container">
    <div class="callback-content">
      <div v-if="loading" class="loading-section">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <h3 class="mt-3">Procesando autenticación...</h3>
        <p class="text-muted">Por favor espera mientras verificamos tu cuenta.</p>
      </div>

      <div v-else-if="error" class="error-section">
        <div class="error-icon">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <h3 class="mt-3 text-danger">Error en la autenticación</h3>
        <p class="text-muted">{{ error }}</p>
        <button @click="goToLogin" class="btn btn-primary">
          Volver al Login
        </button>
      </div>

      <div v-else-if="needsProfileCompletion" class="profile-section">
        <div class="profile-icon">
          <i class="bi bi-person-plus"></i>
        </div>
        <h3 class="mt-3">Completar Perfil</h3>
        <p class="text-muted">
          Has iniciado sesión con Google. Necesitamos que completes algunos datos adicionales para continuar.
        </p>
        <button @click="showCompleteProfileForm" class="btn btn-primary">
          Completar Perfil
        </button>
      </div>

      <div v-else-if="pendingApproval" class="approval-section">
        <div class="approval-icon">
          <i class="bi bi-clock-history"></i>
        </div>
        <h3 class="mt-3">Cuenta Pendiente de Aprobación</h3>
        <p class="text-muted">
          Tu cuenta está siendo revisada por un administrador. Recibirás una notificación cuando sea aprobada.
        </p>
        <button @click="showApprovalDetails" class="btn btn-outline-primary">
          Ver Detalles
        </button>
      </div>

      <div v-else-if="profileComplete" class="success-section">
        <div class="success-icon">
          <i class="bi bi-check-circle"></i>
        </div>
        <h3 class="mt-3 text-success">¡Bienvenido!</h3>
        <p class="text-muted">
          Tu cuenta ha sido configurada correctamente. Serás redirigido al dashboard en unos segundos.
        </p>
        <div class="progress mt-3">
          <div class="progress-bar progress-bar-striped progress-bar-animated" 
               :style="{ width: redirectProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <CompleteGoogleProfile 
      ref="completeProfileModal"
      @profile-completed="handleProfileCompleted"
    />
    
    <ApprovalPending 
      ref="approvalPendingModal"
    />
  </div>
</template>

<script>
import CompleteGoogleProfile from '@/components/CompleteGoogleProfile.vue';
import ApprovalPending from '@/components/ApprovalPending.vue';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'GoogleCallback',
  components: {
    CompleteGoogleProfile,
    ApprovalPending
  },
  data() {
    return {
      loading: true,
      error: null,
      needsProfileCompletion: false,
      pendingApproval: false,
      profileComplete: false,
      redirectProgress: 0,
      redirectInterval: null
    };
  },
  async mounted() {
    await this.handleCallback();
  },
  beforeUnmount() {
    if (this.redirectInterval) {
      clearInterval(this.redirectInterval);
    }
  },
  methods: {
    async handleCallback() {
      try {
        this.loading = true;
        
        // Esperar un momento para que el backend procese la sesión
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar si el usuario está autenticado
        const user = await AuthService.getCurrentUser();
        
        if (!user) {
          // Si no existe el usuario, lo mando directo al login
          this.$router.push('/login');
          return;
        }

        // Verificar si el perfil está completo
        const profileCheck = await AuthService.checkProfileCompletion();
        
        if (!profileCheck.isComplete) {
          // Perfil incompleto - mostrar opción para completarlo
          this.needsProfileCompletion = true;
        } else if (user.rol === 'user' && !user.approved) {
          // Perfil completo pero pendiente de aprobación
          this.pendingApproval = true;
        } else {
          // Perfil completo y aprobado - ir al dashboard
          this.profileComplete = true;
          this.startRedirect();
        }
        
      } catch (error) {
        console.error('Error en callback de Google:', error);
        this.error = error.message || 'Error al procesar la autenticación con Google';
      } finally {
        this.loading = false;
      }
    },

    showCompleteProfileForm() {
      this.$refs.completeProfileModal.show();
    },

    async handleProfileCompleted() {
      console.log('Evento profile-completed recibido');
      
      try {
        // Verificar nuevamente el estado del perfil
        const profileCheck = await AuthService.checkProfileCompletion();
        console.log('Verificación de perfil:', profileCheck);
        
        if (profileCheck.isComplete) {
          console.log('Perfil completo, mostrando aprobación pendiente');
          this.needsProfileCompletion = false;
          
          // Siempre será usuario, mostrar mensaje de espera
          this.pendingApproval = true;
        } else {
          console.log('Perfil aún incompleto');
        }
      } catch (error) {
        console.error('Error en handleProfileCompleted:', error);
      }
    },

    showApprovalDetails() {
      this.$refs.approvalPendingModal.show();
    },

    startRedirect() {
      this.redirectProgress = 0;
      this.redirectInterval = setInterval(() => {
        this.redirectProgress += 10;
        if (this.redirectProgress >= 100) {
          clearInterval(this.redirectInterval);
          this.$router.push('/dashboard');
        }
      }, 200);
    },

    goToLogin() {
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.callback-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.loading-section,
.error-section,
.profile-section,
.approval-section,
.success-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-section .spinner-border {
  width: 3rem;
  height: 3rem;
}

.error-icon,
.profile-icon,
.approval-icon,
.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-icon {
  color: #dc3545;
}

.profile-icon {
  color: #007bff;
}

.approval-icon {
  color: #ffc107;
}

.success-icon {
  color: #28a745;
}

.approval-icon i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.progress {
  height: 0.5rem;
  border-radius: 0.25rem;
}

.progress-bar {
  background-color: #28a745;
}

.btn {
  margin-top: 1rem;
  min-width: 150px;
}

@media (max-width: 768px) {
  .callback-content {
    padding: 2rem;
    margin: 1rem;
  }
  
  .error-icon,
  .profile-icon,
  .approval-icon,
  .success-icon {
    font-size: 3rem;
  }
}
</style>
