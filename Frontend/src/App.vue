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
    await this.checkAuthStatus();
  },
  watch: {
    // Observar cambios en la ruta para actualizar el estado de autenticación
    '$route'() {
      this.checkAuthStatus();
    }
  },
  methods: {
    async checkAuthStatus() {
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
