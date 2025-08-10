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
              <th scope="col">Nombre del Proyecto</th>
              <th scope="col">Fechas</th>
              <th scope="col">Dificultad</th>
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
                  <input type="date" class="form-control" id="projectStartDate" v-model="editableProject.startDate" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="projectEndDate" class="form-label">Fecha de Fin</label>
                  <input type="date" class="form-control" id="projectEndDate" v-model="editableProject.endDate" required>
                </div>
              </div>
               <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="projectDifficulty" class="form-label">Nivel de Dificultad</label>
                  <select class="form-select" id="projectDifficulty" v-model="editableProject.difficulty">
                    <option v-for="opt in difficultyOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
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
      statusOptions: ['Activo', 'Pausado', 'Finalizado']
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
        difficulty: 'Media', status: 'Activo'
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
      if (this.editableProject.startDate > this.editableProject.endDate) {
        this.showAlert('La fecha de fin no puede ser anterior a la fecha de inicio.', 'alert-warning');
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
        if (error.response?.status === 401) {
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
    }
  }
}
</script>
