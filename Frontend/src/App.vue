<template>
  <div id="app">
    <NavbarComponent />
    <main class="main-content">
      <router-view/>
    </main>
  </div>
</template>

<script>
import NavbarComponent from '@/components/Navbar.vue';

export default {
  name: 'App',
  components: {
    NavbarComponent
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
