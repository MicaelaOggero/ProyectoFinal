<template>
  <div class="container-fluid">
    <!-- Encabezado de página -->
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>Gestión de Proyectos</h1>
      <div class="d-flex align-items-center gap-3">
        <button v-if="currentUser && isUserAdmin" class="btn btn-primary" @click="openCreateModal">
          Crear Nuevo Proyecto
        </button>
        <button v-if="!currentUser" class="btn btn-outline-primary" @click="showLoginModal">
          Iniciar Sesión
        </button>
      </div>
    </div>

    <!-- Alertas de estado -->
    <div v-if="alertMessage" class="alert" :class="alertClass" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close" @click="clearAlert" aria-label="Close"></button>
    </div>

    <!-- Tabla de Proyectos -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando proyectos...</p>
        </div>
        
        <div v-else-if="!currentUser" class="text-center py-5">
          <h5>Debes iniciar sesión para ver los proyectos</h5>
          <button class="btn btn-primary mt-3" @click="showLoginModal">Iniciar Sesión</button>
        </div>
        
        <div v-else-if="projects.length === 0" class="text-center py-5">
          <h5>No hay proyectos disponibles</h5>
          <p class="text-muted">{{ isUserAdmin ? 'Crea tu primer proyecto usando el botón "Crear Nuevo Proyecto"' : 'No tienes permisos para crear proyectos. Contacta a un administrador.' }}</p>
        </div>
        
        <table v-else class="table table-hover">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Fechas</th>
              <th scope="col">Dificultad</th>
              <th scope="col">Prioridad</th>
              <th scope="col">Estado</th>
              <th scope="col" title="Fecha y hora en que se creó el proyecto">Fecha de Creación</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project._id">
              <td>{{ project.name }}</td>
              <td>{{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}</td>
              <td>{{ project.difficulty }}</td>
              <td><span class="badge" :class="getPriorityClass(project.priority)">{{ project.priority }}</span></td>
              <td><span class="badge" :class="getStatusClass(project.status)">{{ project.status }}</span></td>
              <td>{{ formatCreationDate(project.fechaCreacion) }}</td>
              <td>
                <router-link :to="{ name: 'ProyectoDetalle', params: { id: project._id } }" class="btn btn-sm btn-info text-white">Ver</router-link>
                <button v-if="isUserAdmin" class="btn btn-sm btn-secondary ms-2" @click="openEditModal(project)">Editar</button>
                <button v-if="isUserAdmin" class="btn btn-sm btn-danger ms-2" @click="deleteProject(project._id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para Crear/Editar Proyecto -->
    <div class="modal fade" id="projectModal" tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="projectModalLabel">{{ isEditMode ? 'Editar Proyecto' : 'Crear Nuevo Proyecto' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveProject">
              <div class="mb-3">
                <label for="projectName" class="form-label">Nombre del Proyecto</label>
                <input type="text" class="form-control" id="projectName" v-model="editableProject.name" required>
              </div>
              <div class="mb-3">
                <label for="projectDescription" class="form-label">Descripción</label>
                <textarea class="form-control" id="projectDescription" rows="3" v-model="editableProject.description"></textarea>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="projectStartDate" class="form-label">Fecha de Inicio</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="projectStartDate" 
                    v-model="editableProject.startDate" 
                    @change="validateDates"
                    :class="{ 'is-invalid': dateErrors.startDate }"
                    required
                  >
                  <div class="invalid-feedback" v-if="dateErrors.startDate">
                    {{ dateErrors.startDate }}
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="projectEndDate" class="form-label">Fecha de Fin</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="projectEndDate" 
                    v-model="editableProject.endDate" 
                    @change="validateDates"
                    :class="{ 'is-invalid': dateErrors.endDate }"
                    required
                  >
                  <div class="invalid-feedback" v-if="dateErrors.endDate">
                    {{ dateErrors.endDate }}
                  </div>
                </div>
              </div>
               <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="projectDifficulty" class="form-label">Nivel de Dificultad</label>
                  <select class="form-select" id="projectDifficulty" v-model="editableProject.difficulty">
                    <option v-for="opt in difficultyOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="projectPriority" class="form-label">Prioridad</label>
                  <select class="form-select" id="projectPriority" v-model="editableProject.priority">
                    <option v-for="opt in priorityOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="projectStatus" class="form-label">Estado</label>
                  <select class="form-select" id="projectStatus" v-model="editableProject.status">
                     <option v-for="opt in statusOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>
              <div v-if="!isEditMode" class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                <strong>Nota:</strong> La fecha de creación se asignará automáticamente al momento de guardar el proyecto.
              </div>
              <div class="modal-footer mt-4">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Componente de Login -->
    <LoginModal ref="loginModal" @login-success="handleLoginSuccess" />

  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import ProjectService from '@/services/project.service.js';
import AuthService from '@/services/auth.service.js';
import LoginModal from '@/components/LoginModal.vue';

export default {
  name: 'ProyectosView',
  components: {
    LoginModal
  },
  data() {
    return {
      modalInstance: null,
      isEditMode: false,
      projects: [],
      editableProject: {},
      currentUser: null,
      loading: false,
      alertMessage: '',
      alertClass: '',
      // Opciones para los selectores
      difficultyOptions: ['Baja', 'Media', 'Alta'],
      statusOptions: ['Activo', 'Pausado', 'Finalizado'],
      priorityOptions: ['Baja', 'Media', 'Alta'],
      dateErrors: {
        startDate: '',
        endDate: ''
      }
    };
  },
  computed: {
    isUserAdmin() {
      return AuthService.isAdmin(this.currentUser);
    }
  },
  async mounted() {
    this.modalInstance = new Modal(document.getElementById('projectModal'));
    await this.checkUserSession();
    if (this.currentUser) {
      this.loadProjects();
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      // Sumar un día porque el input date puede tener problemas de zona horaria
      date.setDate(date.getDate() + 1);
      return date.toLocaleDateString('es-ES');
    },
    formatCreationDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    getStatusClass(status) {
      if (status === 'Activo') return 'bg-success';
      if (status === 'Pausado') return 'bg-warning text-dark';
      if (status === 'Finalizado') return 'bg-secondary';
      return 'bg-light';
    },
    getPriorityClass(priority) {
      if (priority === 'Baja') return 'bg-success';
      if (priority === 'Media') return 'bg-warning text-dark';
      if (priority === 'Alta') return 'bg-danger';
      return 'bg-light';
    },
    async checkUserSession() {
      try {
        this.currentUser = await AuthService.checkSession();
      } catch (error) {
        console.error('Error verificando sesión:', error);
        this.currentUser = null;
      }
    },
    async loadProjects() {
      if (!this.currentUser) {
        this.showAlert('Debes iniciar sesión para ver los proyectos', 'alert-warning');
        return;
      }

      this.loading = true;
      try {
        const response = await ProjectService.getProjects();
        this.projects = response.data;
        this.clearAlert();
      } catch (error) {
        console.error('Error loading projects:', error);
        if (error.response?.status === 401) {
          this.showAlert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'alert-warning');
          this.currentUser = null;
        } else {
          this.showAlert('Error al cargar los proyectos. Intenta nuevamente.', 'alert-danger');
        }
      } finally {
        this.loading = false;
      }
    },
    // --- Métodos de Autenticación ---
    showLoginModal() {
      this.$refs.loginModal.show();
    },
    async handleLoginSuccess() {
      await this.checkUserSession();
      this.showAlert('¡Sesión iniciada correctamente!', 'alert-success');
      this.loadProjects();
    },
    // --- Métodos de Alertas ---
    showAlert(message, className) {
      this.alertMessage = message;
      this.alertClass = className;
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        this.clearAlert();
      }, 5000);
    },
    clearAlert() {
      this.alertMessage = '';
      this.alertClass = '';
    },
    // --- Métodos para el Modal ---
    openCreateModal() {
      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden crear proyectos', 'alert-warning');
        return;
      }
      this.isEditMode = false;
      this.editableProject = {
        name: '', description: '', startDate: '', endDate: '', 
        difficulty: 'Media', status: 'Activo', priority: 'Media'
      };
      this.modalInstance.show();
    },
    openEditModal(project) {
      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden editar proyectos', 'alert-warning');
        return;
      }
      this.isEditMode = true;
      this.editableProject = JSON.parse(JSON.stringify(project));
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    async saveProject() {
      // Validación mejorada de fechas
      if (!this.editableProject.startDate || !this.editableProject.endDate) {
        this.showAlert('Las fechas de inicio y fin son obligatorias', 'alert-warning');
        return;
      }

      const startDate = new Date(this.editableProject.startDate);
      const endDate = new Date(this.editableProject.endDate);
      
      // Validar que las fechas sean válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        this.showAlert('Por favor ingrese fechas válidas', 'alert-warning');
        return;
      }

      // Validar que fechaFin no sea anterior a fechaInicio
      if (endDate < startDate) {
        this.showAlert('La fecha de fin no puede ser anterior a la fecha de inicio. Por favor corrija las fechas.', 'alert-danger');
        return;
      }

      // Validar que la fecha de inicio no sea anterior a hoy
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Obtener solo la fecha en formato YYYY-MM-DD
      if (this.editableProject.startDate < todayString) {
        this.showAlert('La fecha de inicio no puede ser anterior a hoy', 'alert-warning');
        return;
      }

      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden guardar proyectos', 'alert-warning');
        return;
      }

      try {
        if (this.isEditMode) {
          await ProjectService.updateProject(this.editableProject._id, this.editableProject);
          this.showAlert('Proyecto actualizado correctamente', 'alert-success');
        } else {
          await ProjectService.createProject(this.editableProject);
          this.showAlert('Proyecto creado correctamente', 'alert-success');
        }
        this.loadProjects();
        this.closeModal();
      } catch (error) {
        console.error('Error saving project:', error);
        if (error.response?.status === 400 && error.response?.data?.error) {
          // Mostrar mensaje de error específico del backend
          this.showAlert(error.response.data.error, 'alert-danger');
        } else if (error.response?.status === 401) {
          this.showAlert('No tienes permisos para realizar esta acción', 'alert-danger');
        } else {
          this.showAlert('Error al guardar el proyecto. Intenta nuevamente.', 'alert-danger');
        }
      }
    },
    async deleteProject(projectId) {
      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden eliminar proyectos', 'alert-warning');
        return;
      }

      if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Las tareas asociadas no se eliminarán.')) {
        try {
          await ProjectService.deleteProject(projectId);
          this.showAlert('Proyecto eliminado correctamente', 'alert-success');
          this.loadProjects();
        } catch (error) {
          console.error('Error deleting project:', error);
          if (error.response?.status === 401) {
            this.showAlert('No tienes permisos para eliminar proyectos', 'alert-danger');
          } else {
            this.showAlert('Error al eliminar el proyecto. Intenta nuevamente.', 'alert-danger');
          }
        }
      }
    },
    validateDates() {
      this.dateErrors = {
        startDate: '',
        endDate: ''
      };

      const startDate = new Date(this.editableProject.startDate);
      const endDate = new Date(this.editableProject.endDate);

      if (isNaN(startDate.getTime())) {
        this.dateErrors.startDate = 'Fecha de inicio inválida.';
      }
      if (isNaN(endDate.getTime())) {
        this.dateErrors.endDate = 'Fecha de fin inválida.';
      }

      if (this.editableProject.startDate && this.editableProject.endDate) {
        if (endDate < startDate) {
          this.dateErrors.endDate = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
        }
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // Obtener solo la fecha en formato YYYY-MM-DD
        if (this.editableProject.startDate < todayString) {
          this.dateErrors.startDate = 'La fecha de inicio no puede ser anterior a hoy.';
        }
      }
    }
  }
}
</script>

<style scoped>
.modal-dialog {
  max-width: 800px;
}

.table th {
  background-color: #f8f9fa;
  border-top: none;
}

.btn-group .btn {
  margin-right: 5px;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

/* Estilos para validación de fechas */
.is-invalid {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.invalid-feedback {
  display: block;
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 0.25rem;
}

/* Estilos para alertas */
.alert {
  margin-bottom: 1rem;
  border-radius: 0.375rem;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.alert-warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
</style>
