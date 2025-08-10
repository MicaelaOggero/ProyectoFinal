<template>
  <div class="container-fluid">
    <!-- Encabezado con botón de regreso -->
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3" @click="$router.go(-1)">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h1>Perfil de Usuario</h1>
      </div>
      <div v-if="isUserAdmin" class="d-flex gap-2">
        <button class="btn btn-primary" @click="editProfile">Editar Perfil</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando perfil...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Error</h4>
      <p>{{ error }}</p>
      <button class="btn btn-outline-danger" @click="loadUserProfile">Reintentar</button>
    </div>

    <!-- Perfil del Usuario -->
    <div v-else-if="user" class="row">
      <!-- Información Principal -->
      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h3 class="mb-0">{{ user.nombre }} {{ user.apellido }}</h3>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h5>Información Personal</h5>
                <ul class="list-unstyled">
                  <li><strong>DNI:</strong> {{ user.dni }}</li>
                  <li><strong>Rol:</strong> 
                    <span class="badge" :class="getRoleClass(user.rol)">{{ user.rol }}</span>
                  </li>
                  <li><strong>Email:</strong> {{ user.email }}</li>
                  <li><strong>Disponibilidad:</strong> {{ user.disponibilidadSemanal }} hs/semana</li>
                  <li><strong>Costo por Hora:</strong> ${{ user.costoPorHora }}</li>
                </ul>
              </div>
              <div class="col-md-6">
                <h5>Información del Sistema</h5>
                <ul class="list-unstyled">
                  <li><strong>Fecha de Creación:</strong> {{ formatDate(user.fechaCreacion) }}</li>
                  <li><strong>ID de Usuario:</strong> <code>{{ user._id }}</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Habilidades -->
        <div class="card mb-4">
          <div class="card-header bg-success text-white">
            <h4 class="mb-0">Habilidades Técnicas</h4>
          </div>
          <div class="card-body">
            <div v-if="user.habilidades && user.habilidades.length > 0" class="row">
              <div v-for="(skill, index) in user.habilidades" :key="index" class="col-md-6 mb-3">
                <div class="card border-success">
                  <div class="card-body">
                    <h6 class="card-title text-success">{{ skill.nombre }}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="badge bg-primary">{{ skill.nivel }}</span>
                      <span class="text-muted">{{ skill.aniosExperiencia }} años de experiencia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <p>No se han registrado habilidades técnicas.</p>
            </div>
          </div>
        </div>

        <!-- Preferencias -->
        <div v-if="user.preferencias" class="card mb-4">
          <div class="card-header bg-info text-white">
            <h4 class="mb-0">Preferencias</h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6" v-if="user.preferencias.tipoTarea && user.preferencias.tipoTarea.length > 0">
                <h6>Tipo de Tareas Preferidas:</h6>
                <div class="d-flex flex-wrap gap-1">
                  <span v-for="tipo in user.preferencias.tipoTarea" :key="tipo" 
                        class="badge bg-secondary">{{ tipo }}</span>
                </div>
              </div>
              <div class="col-md-6" v-if="user.preferencias.tecnologias && user.preferencias.tecnologias.length > 0">
                <h6>Tecnologías Preferidas:</h6>
                <div class="d-flex flex-wrap gap-1">
                  <span v-for="tech in user.preferencias.tecnologias" :key="tech" 
                        class="badge bg-info">{{ tech }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar con Estadísticas -->
      <div class="col-md-4">
        <!-- Estadísticas Rápidas -->
        <div class="card mb-4">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0">Estadísticas</h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <h3 class="text-primary">{{ user.habilidades ? user.habilidades.length : 0 }}</h3>
                <p class="text-muted mb-0">Habilidades</p>
              </div>
              <div class="mb-3">
                <h3 class="text-success">{{ user.disponibilidadSemanal }}</h3>
                <p class="text-muted mb-0">Horas/Semana</p>
              </div>
              <div>
                <h3 class="text-info">${{ user.costoPorHora }}</h3>
                <p class="text-muted mb-0">Costo/Hora</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial de Desempeño -->
        <div v-if="user.historialDesempeño && user.historialDesempeño.length > 0" class="card">
          <div class="card-header bg-dark text-white">
            <h5 class="mb-0">Historial de Desempeño</h5>
          </div>
          <div class="card-body">
            <div v-for="(historial, index) in user.historialDesempeño.slice(0, 3)" :key="index" class="mb-2">
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">Proyecto {{ index + 1 }}</small>
                <span class="badge" :class="getRatingClass(historial.calificacion)">
                  {{ historial.calificacion }}/5
                </span>
              </div>
              <div class="progress mt-1" style="height: 6px;">
                <div class="progress-bar" :class="getRatingClass(historial.calificacion)" 
                     :style="{ width: (historial.calificacion / 5) * 100 + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición (reutilizar el existente) -->
    <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Editar Perfil</h5>
            <button type="button" class="btn-close" @click="closeEditModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Aquí iría el formulario de edición -->
            <p class="text-muted">La funcionalidad de edición se implementará próximamente.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import UserService from '@/services/user.service.js';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'PerfilUsuarioView',
  data() {
    return {
      user: null,
      loading: true,
      error: null,
      editModalInstance: null,
      currentUser: null
    };
  },
  computed: {
    isUserAdmin() {
      return AuthService.isAdmin(this.currentUser);
    }
  },
  async mounted() {
    this.editModalInstance = new Modal(document.getElementById('editProfileModal'));
    await this.checkUserSession();
    this.loadUserProfile();
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
    async loadUserProfile() {
      this.loading = true;
      this.error = null;
      
      try {
        const userId = this.$route.params.id;
        const response = await UserService.getUserById(userId);
        this.user = response.data;
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.error = 'No se pudo cargar el perfil del usuario. Verifica que el ID sea válido.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    getRoleClass(role) {
      return role === 'admin' ? 'bg-danger' : 'bg-primary';
    },
    getRatingClass(rating) {
      if (rating >= 4) return 'bg-success';
      if (rating >= 3) return 'bg-warning';
      return 'bg-danger';
    },
    editProfile() {
      this.editModalInstance.show();
    },
    closeEditModal() {
      this.editModalInstance.hide();
    }
  }
}
</script>

<style scoped>
.card-header {
  border-bottom: none;
}

.badge {
  font-size: 0.9em;
}

.progress {
  background-color: #e9ecef;
}

.progress-bar {
  transition: width 0.6s ease;
}

.text-decoration-none:hover {
  text-decoration: underline !important;
}
</style> 