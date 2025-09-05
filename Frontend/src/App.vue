<template>
  <div id="app">
    <NavbarComponent v-if="isAuthenticated" />
    <main class="main-content">
      <router-view/>
    </main>
  </div>
</template>

<script>
import NavbarComponent from '@/components/Navbar.vue';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'App',
  components: {
    NavbarComponent
  },
  data() {
    return {
      isAuthenticated: false
    };
  },
  async created() {
    // En páginas de autenticación, no hacer nada
    if (this.isAuthPage()) {
      console.log('App: Página de autenticación, no verificando sesión');
      return;
    }
    
    // Solo verificar autenticación si no estamos en páginas de autenticación
    await this.checkAuthStatus();
  },
  watch: {
    // Observar cambios en la ruta para actualizar el estado de autenticación
    '$route'() {
      if (this.isAuthPage()) {
        // En páginas de autenticación, no mostrar navbar
        this.isAuthenticated = false;
      } else {
        // Solo verificar autenticación si no estamos en páginas de autenticación
        this.checkAuthStatus();
      }
    }
  },
  methods: {
    isAuthPage() {
      // Páginas donde no necesitamos verificar la autenticación
      const authRoutes = ['/login', '/google-callback'];
      // Verificar que la ruta esté disponible
      return this.$route && this.$route.path && authRoutes.includes(this.$route.path);
    },
    async checkAuthStatus() {
      console.log('Verificando autenticación para ruta:', this.$route.path);
      
      try {
        const user = await AuthService.getCurrentUser();
        this.isAuthenticated = !!user;
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        this.isAuthenticated = false;
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 0;
}

/* Reset global */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

/* Asegurar que el navbar esté en la parte superior */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
}
</style>
