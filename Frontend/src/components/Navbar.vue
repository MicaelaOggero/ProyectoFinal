<template>
  <nav class="navbar navbar-expand-lg custom-navbar">
    <div class="container-fluid">
      <!-- Iconos de navegación -->
      <div class="navbar-left-section">
        <router-link to="/dashboard" class="nav-link-icon">
          <i class="bi bi-house-door-fill home-icon me-3" title="Inicio"></i>
        </router-link>
        <i class="bi bi-bell notification-icon me-3" title="Notificaciones"></i>
      </div>

      <!-- Título centrado -->
      <div class="navbar-brand-container">
        <span class="navbar-brand-text">Gestor de Proyectos</span>
      </div>

      <!-- Información del usuario y acciones -->
      <div class="navbar-right-section">
        <div v-if="currentUser" class="user-info">
          <span class="user-name">
            {{ currentUser.nombre }} {{ currentUser.apellido }}
            <span class="role-badge">{{ currentUser.rol }}</span>
          </span>
        </div>
        <div class="logout-section">
          <a v-if="currentUser" class="nav-link logout-link" href="#" @click.prevent="handleLogout">
            <i class="bi bi-box-arrow-right me-1"></i>
            Cerrar Sesión
          </a>
          <router-link v-else class="nav-link" to="/login">Iniciar Sesión</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import AuthService from '@/services/auth.service.js';

export default {
  name: 'NavbarComponent',
  data() {
    return {
      currentUser: null
    };
  },
  async mounted() {
    await this.checkUserSession();
  },
  watch: {
    // Observar cambios en la ruta para actualizar la sesión
    '$route'() {
      this.checkUserSession();
    }
  },
  methods: {
    async checkUserSession() {
      try {
        const user = await AuthService.checkSession();
        this.currentUser = user;
        console.log('Usuario actual en navbar:', user);
      } catch (error) {
        console.error('Error verificando sesión:', error);
        this.currentUser = null;
      }
    },
    async handleLogout() {
      try {
        await AuthService.logout();
        this.currentUser = null;
        this.$router.push('/login');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Limpiar sesión local y redirigir de todas formas
        this.currentUser = null;
        this.$router.push('/login');
      }
    }
  }
}
</script>

<style scoped>
.custom-navbar {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-left-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.navbar-brand-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 2;
}

.navbar-brand-text {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
}

.navbar-right-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  gap: 1rem;
}

.nav-link-icon {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
}

.nav-link-icon:hover {
  text-decoration: none;
  color: inherit;
}

.home-icon, .notification-icon {
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s;
}

.home-icon:hover, .notification-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-badge {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.logout-section {
  display: flex;
  align-items: center;
}

.logout-link {
  display: flex;
  align-items: center;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #ff6b6b !important;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.logout-link:hover {
  background: rgba(220, 53, 69, 0.2) !important;
  border-color: rgba(220, 53, 69, 0.5);
  color: #ff8787 !important;
  transform: translateY(-1px);
  text-decoration: none;
}

.btn-link {
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s;
}

.btn-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive adjustments */
@media (max-width: 991.98px) {
  .custom-navbar {
    padding: 1rem;
  }
  
  .navbar-brand-text {
    font-size: 1.3rem;
  }
  
  .navbar-left-section {
    flex: 0.8;
  }
  
  .navbar-brand-container {
    flex: 1.5;
  }
  
  .navbar-right-section {
    flex: 0.8;
  }
}

@media (max-width: 767.98px) {
  .navbar-left-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .navbar-brand-container {
    order: -1;
    margin-bottom: 0.5rem;
  }
  
  .navbar-brand-text {
    font-size: 1.1rem;
  }
  
  .navbar-right-section {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }
  
  .user-info {
    margin-bottom: 0.5rem;
  }
  
  .user-name {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
