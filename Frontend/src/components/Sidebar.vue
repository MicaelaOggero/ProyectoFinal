<template>
  <div class="d-flex flex-column flex-shrink-0 p-3 bg-light vh-100" style="width: 280px;">
    <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
      <span class="fs-4">Menú</span>
    </a>
    <hr>
    <ul class="nav nav-pills flex-column mb-auto">
      <li class="nav-item">
        <router-link to="/dashboard" class="nav-link" active-class="active">
          Dashboard
        </router-link>
      </li>
      <li>
        <router-link to="/proyectos" class="nav-link link-dark" active-class="active">
          Proyectos
        </router-link>
      </li>
      <li>
        <router-link to="/tareas" class="nav-link link-dark" active-class="active">
          Tareas
        </router-link>
      </li>
      <li>
        <router-link to="/personas" class="nav-link link-dark" active-class="active">
          Personas
        </router-link>
      </li>
    </ul>
    <hr>
  </div>
</template>

<script>
export default {
  name: 'SidebarComponent'
}
</script>

<style scoped>
.nav-link.active {
  background-color: #0d6efd !important; /* Color primario de Bootstrap */
  color: white !important;
}
</style>
