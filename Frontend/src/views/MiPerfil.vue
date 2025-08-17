<template>
  <div class="container-fluid">
    <!-- Encabezado con botón de regreso -->
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3" @click="$router.go(-1)">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h1>Mi Perfil</h1>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary" @click="editProfile">
          <i class="bi bi-pencil me-2"></i>Editar Perfil
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando tu perfil...</p>
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
            <div class="d-flex align-items-center">
              <div class="user-avatar me-3">
                <i class="bi bi-person-circle"></i>
              </div>
              <div>
                <h3 class="mb-0">{{ user.nombre }} {{ user.apellido }}</h3>
                <p class="mb-0 opacity-75">{{ user.email }}</p>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h5>Información Personal</h5>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <i class="bi bi-card-text me-2 text-muted"></i>
                    <strong>DNI:</strong> {{ user.dni || 'No especificado' }}
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-shield-check me-2 text-muted"></i>
                    <strong>Rol:</strong> 
                    <span class="badge" :class="getRoleClass(user.rol)">
                      {{ user.rol === 'admin' ? 'Administrador' : 'Desarrollador' }}
                    </span>
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-clock me-2 text-muted"></i>
                    <strong>Disponibilidad:</strong> {{ user.disponibilidadSemanal || 'No especificada' }} hs/semana
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-currency-dollar me-2 text-muted"></i>
                    <strong>Costo por Hora:</strong> ${{ user.costoPorHora || 'No especificado' }}
                  </li>
                  <li class="mb-2" v-if="user.aniosExperiencia">
                    <i class="bi bi-calendar-check me-2 text-muted"></i>
                    <strong>Experiencia:</strong> {{ user.aniosExperiencia }} años
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <h5>Información del Sistema</h5>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <i class="bi bi-calendar-plus me-2 text-muted"></i>
                    <strong>Fecha de Registro:</strong> {{ formatDate(user.fechaCreacion) }}
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-fingerprint me-2 text-muted"></i>
                    <strong>ID de Usuario:</strong> <code class="small">{{ user._id || 'No disponible' }}</code>
                  </li>
                  <li class="mb-2" v-if="user.googleId">
                    <i class="bi bi-google me-2 text-muted"></i>
                    <strong>Registrado con:</strong> Google
                  </li>
                  <li class="mb-2" v-if="user.approved !== undefined">
                    <i class="bi bi-check-circle me-2 text-muted"></i>
                    <strong>Estado de Aprobación:</strong> 
                    <span class="badge" :class="user.approved ? 'bg-success' : 'bg-warning'">
                      {{ user.approved ? 'Aprobado' : 'Pendiente' }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Habilidades -->
        <div class="card mb-4">
          <div class="card-header bg-success text-white">
            <h4 class="mb-0">
              <i class="bi bi-tools me-2"></i>
              Habilidades Técnicas
            </h4>
          </div>
          <div class="card-body">
            <div v-if="user.habilidades && user.habilidades.length > 0" class="row">
              <div v-for="(skill, index) in user.habilidades" :key="index" class="col-md-6 mb-3">
                <div class="card border-success h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <h6 class="card-title text-success mb-2">{{ skill.nombre }}</h6>
                      <span class="badge bg-success">{{ getNivelText(skill.nivel) }}</span>
                    </div>
                    <div class="skill-level-bar mb-2">
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" 
                             :style="{ width: (skill.nivel / 5) * 100 + '%' }"></div>
                      </div>
                      <small class="text-muted">Nivel {{ skill.nivel }}/5</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-tools" style="font-size: 3rem; opacity: 0.5;"></i>
              <p class="mt-2">No se han registrado habilidades técnicas.</p>
              <button class="btn btn-outline-success btn-sm" @click="editProfile">
                <i class="bi bi-plus-circle me-1"></i>Agregar Habilidades
              </button>
            </div>
          </div>
        </div>

        <!-- Preferencias -->
        <div v-if="user.preferencias" class="card mb-4">
          <div class="card-header bg-info text-white">
            <h4 class="mb-0">
              <i class="bi bi-heart me-2"></i>
              Preferencias de Trabajo
            </h4>
          </div>
          <div class="card-body">
            <p class="text-muted">{{ user.preferencias }}</p>
          </div>
        </div>
      </div>

      <!-- Sidebar con Estadísticas -->
      <div class="col-md-4">
        <!-- Estado de la Cuenta -->
        <div v-if="user.rol !== 'admin'" class="card mb-4">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Estado de la Cuenta
            </h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <div class="status-indicator" :class="getStatusClass(user.approved)">
                  <i :class="getStatusIcon(user.approved)"></i>
                </div>
                <h6 class="mt-2">{{ getStatusText(user.approved) }}</h6>
                <p class="text-muted small">{{ getStatusDescription(user.approved) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado de Administrador -->
        <div v-else class="card mb-4">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">
              <i class="bi bi-shield-check me-2"></i>
              Estado de Administrador
            </h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <div class="status-indicator status-admin">
                  <i class="bi bi-shield-check"></i>
                </div>
                <h6 class="mt-2">Cuenta de Administrador</h6>
                <p class="text-muted small">Tienes acceso completo al sistema</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas Rápidas -->
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-graph-up me-2"></i>
              Estadísticas
            </h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <h3 class="text-success">{{ user.habilidades ? user.habilidades.length : 0 }}</h3>
                <p class="text-muted mb-0">Habilidades</p>
              </div>
              <div class="mb-3">
                <h3 class="text-info">{{ user.disponibilidadSemanal || 'N/A' }}</h3>
                <p class="text-muted mb-0">Horas/Semana</p>
              </div>
              <div>
                <h3 class="text-warning">${{ user.costoPorHora || 'N/A' }}</h3>
                <p class="text-muted mb-0">Costo/Hora</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="card">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">
              <i class="bi bi-lightning me-2"></i>
              Acciones Rápidas
            </h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-outline-primary btn-sm" @click="editProfile">
                <i class="bi bi-pencil me-1"></i>Editar Perfil
              </button>
              <button class="btn btn-outline-success btn-sm" @click="goToProjects">
                <i class="bi bi-folder me-1"></i>Ver Mis Proyectos
              </button>
              <button class="btn btn-outline-info btn-sm" @click="goToTasks">
                <i class="bi bi-list-task me-1"></i>Ver Mis Tareas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Editar Mi Perfil</h5>
            <button type="button" class="btn-close" @click="closeEditModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
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
import AuthService from '@/services/auth.service.js';

export default {
  name: 'MiPerfilView',
  data() {
    return {
      user: null,
      loading: true,
      error: null,
      editModalInstance: null
    };
  },
  async mounted() {
    this.editModalInstance = new Modal(document.getElementById('editProfileModal'));
    await this.loadUserProfile();
  },
  methods: {
    async loadUserProfile() {
      this.loading = true;
      this.error = null;
      
      try {
        // Obtener el usuario actual de la sesión
        const currentUser = await AuthService.checkSession();
        if (currentUser) {
          // Si checkSession no devuelve datos completos, intentar obtener más información
          if (!currentUser.dni || !currentUser.habilidades) {
            console.log('Datos incompletos del usuario, intentando obtener perfil completo...');
            try {
              // Intentar obtener perfil completo
              const profileResponse = await AuthService.checkProfileCompletion();
              if (profileResponse.user) {
                this.user = { ...currentUser, ...profileResponse.user };
              } else {
                this.user = currentUser;
              }
            } catch (profileError) {
              console.log('No se pudo obtener perfil completo, usando datos de sesión:', profileError);
              this.user = currentUser;
            }
          } else {
            this.user = currentUser;
          }
          
          console.log('Usuario cargado:', this.user);
        } else {
          this.error = 'No se pudo cargar tu perfil. Por favor, inicia sesión nuevamente.';
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.error = 'No se pudo cargar tu perfil. Verifica tu conexión e intenta nuevamente.';
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
    getNivelText(nivel) {
      const niveles = {
        1: 'Principiante',
        2: 'Básico',
        3: 'Intermedio',
        4: 'Avanzado',
        5: 'Experto'
      };
      return niveles[nivel] || 'N/A';
    },
    getStatusClass(approved) {
      return approved ? 'status-approved' : 'status-pending';
    },
    getStatusIcon(approved) {
      return approved ? 'bi bi-check-circle-fill' : 'bi bi-clock-fill';
    },
    getStatusText(approved) {
      return approved ? 'Cuenta Aprobada' : 'Pendiente de Aprobación';
    },
    getStatusDescription(approved) {
      return approved 
        ? 'Tu cuenta está activa y puedes acceder a todos los proyectos'
        : 'Tu cuenta está siendo revisada por un administrador';
    },
    editProfile() {
      this.editModalInstance.show();
    },
    closeEditModal() {
      this.editModalInstance.hide();
    },
    goToProjects() {
      this.$router.push('/proyectos');
    },
    goToTasks() {
      this.$router.push('/tareas');
    }
  }
}
</script>

<style scoped>
.user-avatar {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.8);
}

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

.status-indicator {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2rem;
}

.status-approved {
  background-color: #d4edda;
  color: #155724;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-admin {
  background-color: #d1ecf1;
  color: #0c5460;
}

.skill-level-bar .progress {
  margin-bottom: 0.5rem;
}

.text-decoration-none:hover {
  text-decoration: underline !important;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: none;
  border-radius: 8px;
}

.card-header {
  border-radius: 8px 8px 0 0 !important;
}

.list-unstyled li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.list-unstyled li:last-child {
  border-bottom: none;
}

code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85em;
}
</style>
