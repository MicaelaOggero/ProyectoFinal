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
  if (localStorage.getItem("token")) {
    this.checkAuthStatus(); // solo llamamos si hay token
  }
},

watch: {
  '$route'() {
    if (this.$route.path !== '/login') {
      this.checkAuthStatus();
    }
  }
},


  methods: {
 async checkAuthStatus() {
  if (this.$route.path === '/login') {
    this.isAuthenticated = false;
    return;
  }

  try {
    let user = await AuthService.getCurrentUser(); // login normal

    // Si no hay usuario normal, probar con Google
    if (!user) {
      user = await AuthService.getCurrentUserGoogle();
    }

    this.isAuthenticated = !!user;

    if (!user) {
      this.$router.push('/login');
    } else {
      this.$root.currentUser = user;
    }
  } catch {
    this.isAuthenticated = false;
    this.$router.push('/login');
  }
},



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