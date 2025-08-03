<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">Gestor de Proyectos</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/proyectos">Proyectos</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/personas">Personas</router-link>
          </li>
        </ul>
        <ul class="navbar-nav ms-auto">
          <li v-if="currentUser" class="nav-item">
            <span class="navbar-text text-light me-3">
              {{ currentUser.nombre }} {{ currentUser.apellido }}
              <span class="badge bg-info ms-1">{{ currentUser.rol }}</span>
            </span>
          </li>
          <li class="nav-item">
            <a v-if="currentUser" class="nav-link" href="#" @click.prevent="handleLogout">Cerrar Sesión</a>
            <router-link v-else class="nav-link" to="/login">Iniciar Sesión</router-link>
          </li>
        </ul>
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
  methods: {
    async checkUserSession() {
      try {
        this.currentUser = await AuthService.checkSession();
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
        // Redirigir al login de todas formas
        this.$router.push('/login');
      }
    }
  }
}
</script>
