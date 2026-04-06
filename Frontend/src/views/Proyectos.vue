<template>
  <div class="proyectos-page">
    <div class="container-fluid px-3 px-lg-4 py-4">
      <!-- Encabezado -->
      <header class="proyectos-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 class="proyectos-title mb-1">{{ isUserAdmin ? 'Proyectos' : 'Mis Proyectos' }}</h1>
          <p class="proyectos-subtitle text-muted mb-0">
            {{ isUserAdmin ? 'Gestiona y supervisa todos tus proyectos' : 'Proyectos en los que participas' }}
          </p>
        </div>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <button v-if="currentUser && isUserAdmin" type="button" class="btn btn-create-project" @click="openCreateModal">
            <i class="bi bi-plus-lg me-1"></i>
            Crear Nuevo Proyecto
          </button>
          <button v-if="!currentUser" type="button" class="btn btn-outline-primary" @click="showLoginModal">
            Iniciar Sesión
          </button>
        </div>
      </header>

      <!-- Alertas -->
      <div v-if="alertMessage" class="alert" :class="alertClass" role="alert">
        {{ alertMessage }}
        <button type="button" class="btn-close" @click="clearAlert" aria-label="Cerrar"></button>
      </div>

      <!-- Carga -->
      <div v-if="loading" class="text-center py-5 proyectos-panel">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted mb-0">Cargando proyectos...</p>
      </div>

      <!-- Sin sesión -->
      <div v-else-if="!currentUser" class="proyectos-panel empty-state text-center py-5">
        <i class="bi bi-folder2-open display-4 text-muted d-block mb-3"></i>
        <h5 class="fw-semibold">Debes iniciar sesión para ver los proyectos</h5>
        <button type="button" class="btn btn-primary mt-3" @click="showLoginModal">Iniciar Sesión</button>
      </div>

      <!-- Lista vacía -->
      <div v-else-if="projects.length === 0" class="proyectos-panel empty-state text-center py-5">
        <i class="bi bi-kanban display-4 text-muted d-block mb-3"></i>
        <h5 class="fw-semibold">{{ isUserAdmin ? 'No hay proyectos disponibles' : 'No tienes proyectos asignados' }}</h5>
        <p class="text-muted mx-auto mb-0" style="max-width: 420px;">
          {{ isUserAdmin
            ? 'Crea tu primer proyecto con el botón superior.'
            : 'Los proyectos aparecerán aquí cuando te asignen tareas.' }}
        </p>
      </div>

      <!-- Contenido principal -->
      <template v-else>
        <!-- Métricas -->
        <div class="row g-3 g-lg-4 mb-4">
          <div v-for="card in statsCards" :key="card.key" class="col-6 col-lg-3">
            <div class="stat-card h-100">
              <div class="stat-icon-wrap" :class="card.iconWrapClass">
                <i :class="card.icon"></i>
              </div>
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </div>

        <!-- Búsqueda y filtros -->
        <div class="filters-bar proyectos-panel mb-4">
          <div class="row g-2 g-md-3 align-items-stretch align-items-md-center">
            <div class="col-12 col-md-5 col-lg-5">
              <label class="visually-hidden" for="buscarProyectos">Buscar</label>
              <div class="input-group input-group-search">
                <span class="input-group-text border-end-0 bg-white"><i class="bi bi-search text-muted"></i></span>
                <input
                  id="buscarProyectos"
                  v-model="searchQuery"
                  type="search"
                  class="form-control border-start-0"
                  placeholder="Buscar proyectos..."
                  autocomplete="off"
                >
              </div>
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <label class="visually-hidden" for="filtroEstado">Estado</label>
              <select id="filtroEstado" v-model="filterStatus" class="form-select">
                <option value="">Todos los estados</option>
                <option v-for="opt in statusOptions" :key="'st-' + opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="col-6 col-md-3 col-lg-2">
              <label class="visually-hidden" for="filtroPrioridad">Prioridad</label>
              <select id="filtroPrioridad" v-model="filterPriority" class="form-select">
                <option value="">Todas las prioridades</option>
                <option v-for="opt in priorityOptions" :key="'pr-' + opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sin resultados de filtro -->
        <div v-if="filteredProjects.length === 0" class="proyectos-panel empty-state text-center py-5">
          <i class="bi bi-funnel display-6 text-muted d-block mb-2"></i>
          <p class="text-muted mb-0">No hay proyectos que coincidan con la búsqueda o los filtros.</p>
        </div>

        <!-- Tarjetas de proyecto -->
        <div v-else class="project-cards">
          <article
            v-for="project in filteredProjects"
            :key="project._id"
            class="project-card proyectos-panel"
          >
            <div class="project-card-main">
              <div class="project-card-title-row">
                <h2 class="project-name h5 mb-0">{{ project.name }}</h2>
                <div class="project-badges d-flex flex-wrap gap-2 align-items-center">
                  <span class="badge rounded-pill" :class="getStatusPillClass(project.status)">
                    <i class="bi bi-circle-fill status-dot me-1"></i>{{ project.status }}
                  </span>
                  <span class="badge rounded-pill" :class="getPriorityPillClass(project.priority)">
                    {{ project.priority }}
                  </span>
                </div>
              </div>
              <div class="project-meta text-muted small mt-2">
                <span class="me-3">
                  <i class="bi bi-calendar-range me-1"></i>
                  {{ formatDate(project.startDate) }} — {{ formatDate(project.endDate) }}
                </span>
                <span class="me-3">
                  <i class="bi bi-clock me-1"></i>
                  {{ formatCreationDate(project.fechaCreacion) }}
                </span>
                <span>
                  <i class="bi bi-bar-chart-steps me-1"></i>
                  Dificultad: <strong class="text-body">{{ project.difficulty }}</strong>
                </span>
              </div>
              <div class="project-progress mt-3">
                <div class="d-flex justify-content-between align-items-center mb-1 small">
                  <span class="text-muted">Avance estimado</span>
                  <span class="fw-semibold text-body">{{ getProjectProgress(project) }}%</span>
                </div>
                <div class="progress progress-thin" role="progressbar" :aria-valuenow="getProjectProgress(project)" aria-valuemin="0" aria-valuemax="100">
                  <div
                    class="progress-bar"
                    :class="getProgressBarClass(project.status)"
                    :style="{ width: getProjectProgress(project) + '%' }"
                  />
                </div>
              </div>
            </div>
            <div class="project-card-actions d-flex flex-shrink-0 align-items-start gap-2">
              <router-link
                :to="{ name: 'ProyectoDetalle', params: { id: project._id } }"
                class="btn btn-outline-primary btn-sm btn-view"
              >
                <i class="bi bi-eye me-1"></i> Ver
              </router-link>
              <div v-if="isUserAdmin" class="dropdown">
                <button
                  class="btn btn-light border btn-icon"
                  type="button"
                  :id="'menu-' + project._id"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Más acciones"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" :aria-labelledby="'menu-' + project._id">
                  <li>
                    <button type="button" class="dropdown-item" @click="openEditModal(project)">
                      <i class="bi bi-pencil me-2 text-secondary"></i>Editar
                    </button>
                  </li>
                  <li v-if="project.status === 'Pendiente'">
                    <button type="button" class="dropdown-item" @click="iniciarProyecto(project._id)">
                      <i class="bi bi-play-fill me-2 text-success"></i>Iniciar
                    </button>
                  </li>
                  <li v-if="project.status === 'En Curso'">
                    <button type="button" class="dropdown-item" @click="pausarProyecto(project._id)">
                      <i class="bi bi-pause-fill me-2 text-warning"></i>Pausar
                    </button>
                  </li>
                  <li v-if="project.status === 'Pausado'">
                    <button type="button" class="dropdown-item" @click="iniciarProyecto(project._id)">
                      <i class="bi bi-play-fill me-2 text-success"></i>Reanudar
                    </button>
                  </li>
                  <li v-if="project.status === 'En Curso'">
                    <button type="button" class="dropdown-item" @click="finalizarProyecto(project._id)">
                      <i class="bi bi-check-circle me-2 text-secondary"></i>Finalizar
                    </button>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <button type="button" class="dropdown-item text-danger" @click="deleteProject(project._id)">
                      <i class="bi bi-trash me-2"></i>Eliminar
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </template>
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
                  <label for="projectStartDate" class="form-label">Fecha de Inicio Estimada</label>
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
                  <label for="projectEndDate" class="form-label">Fecha de Fin Estimada</label>
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
import TaskService from '@/services/task.service.js';
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
      statusOptions: ['Pendiente', 'En Curso', 'Pausado', 'Finalizado'],
      priorityOptions: ['Baja', 'Media', 'Alta'],
      dateErrors: {
        startDate: '',
        endDate: ''
      },
      searchQuery: '',
      filterStatus: '',
      filterPriority: ''
    };
  },
  computed: {
    isUserAdmin() {
      return AuthService.isAdmin(this.currentUser);
    },
    filteredProjects() {
      let list = [...(this.projects || [])];
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (q) {
        list = list.filter(p => (p.name || '').toLowerCase().includes(q));
      }
      if (this.filterStatus) {
        list = list.filter(p => p.status === this.filterStatus);
      }
      if (this.filterPriority) {
        list = list.filter(p => p.priority === this.filterPriority);
      }
      return list;
    },
    statsCards() {
      const p = this.projects || [];
      const total = p.length;
      const pendientes = p.filter(x => x.status === 'Pendiente').length;
      const enCurso = p.filter(x => x.status === 'En Curso').length;
      const finalizados = p.filter(x => x.status === 'Finalizado').length;
      return [
        {
          key: 'total',
          value: total,
          label: 'Total Proyectos',
          icon: 'bi bi-folder2-open',
          iconWrapClass: 'stat-icon-total'
        },
        {
          key: 'pend',
          value: pendientes,
          label: 'Pendientes',
          icon: 'bi bi-hourglass-split',
          iconWrapClass: 'stat-icon-pend'
        },
        {
          key: 'curso',
          value: enCurso,
          label: 'En Curso',
          icon: 'bi bi-play-circle',
          iconWrapClass: 'stat-icon-curso'
        },
        {
          key: 'fin',
          value: finalizados,
          label: 'Finalizados',
          icon: 'bi bi-check-circle',
          iconWrapClass: 'stat-icon-fin'
        }
      ];
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
      // Crear la fecha en zona horaria local para evitar problemas de UTC
      const date = new Date(dateString + 'T00:00:00');
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) return 'N/A';
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
    getStatusPillClass(status) {
      const s = (status || '').toString();
      if (s === 'En Curso' || s === 'Activo') return 'bg-success-subtle text-success-emphasis border border-success-subtle';
      if (s === 'Pendiente') return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
      if (s === 'Pausado') return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      if (s === 'Finalizado') return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
      return 'bg-light text-dark border';
    },
    getPriorityPillClass(priority) {
      if (priority === 'Baja') return 'bg-success-subtle text-success-emphasis border border-success-subtle';
      if (priority === 'Media') return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      if (priority === 'Alta') return 'bg-danger-subtle text-danger-emphasis border border-danger-subtle';
      return 'bg-light text-dark border';
    },
    getProjectProgress(project) {
      const s = (project.status || '').toString();
      if (s === 'Finalizado') return 100;
      if (s === 'En Curso') return 65;
      if (s === 'Pausado') return 40;
      return 0;
    },
    getProgressBarClass(status) {
      const s = (status || '').toString();
      if (s === 'Finalizado') return 'bg-success';
      if (s === 'En Curso') return 'bg-success';
      if (s === 'Pausado') return 'bg-warning';
      return 'bg-secondary';
    },
    async checkUserSession() {
      try {
        this.currentUser = await AuthService.checkSession();
        console.log('🔍 Proyectos - Usuario actual:', this.currentUser);
        console.log('🔍 Proyectos - Rol del usuario:', this.currentUser?.rol);
        console.log('🔍 Proyectos - Es admin?', this.isUserAdmin);
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
        console.log('🔍 Proyectos - Cargando proyectos...');
        console.log('🔍 Proyectos - Usuario es admin?', this.isUserAdmin);

        if (this.isUserAdmin) {
          // Para administradores: cargar todos los proyectos
          const response = await ProjectService.getProjects();
          console.log('🔍 Proyectos - Respuesta del servicio:', response);
          console.log('🔍 Proyectos - Proyectos recibidos:', response.data);
          console.log('🔍 Proyectos - Cantidad de proyectos:', response.data.length);
          this.projects = response.data;
        } else {
          // Para usuarios normales: cargar solo sus proyectos desde las tareas asignadas
          console.log('🔍 Proyectos - Cargando proyectos del usuario:', this.currentUser._id);
          
          // Cargar tareas del usuario actual
          const userTasks = await TaskService.getTasksByDeveloper(this.currentUser._id);
          console.log('🔍 Proyectos - Tareas del usuario cargadas:', userTasks);

          // Para usuarios normales, las tareas ya vienen con el proyecto populado desde el backend
          // Mapear al mismo formato que usa el admin (ProjectService._mapToFrontend)
          const uniqueProjects = new Map();
          const difficultyMap = { 1: 'Baja', 2: 'Baja', 3: 'Media', 4: 'Alta', 5: 'Alta' };
          const statusMap = { 'pendiente': 'Pendiente', 'en curso': 'En Curso', 'pausado': 'Pausado', 'finalizado': 'Finalizado', 'activo': 'En Curso' };
          const priorityMap = { 'baja': 'Baja', 'media': 'Media', 'alta': 'Alta' };
          if (userTasks) {
            userTasks.forEach(task => {
              if (task.proyecto && task.proyecto._id) {
                const p = task.proyecto;
                const fechaInicio = p.fechaInicioEstimada ? (typeof p.fechaInicioEstimada === 'string' ? p.fechaInicioEstimada.split('T')[0] : new Date(p.fechaInicioEstimada).toISOString().split('T')[0]) : '';
                const fechaFin = p.fechaFinEstimada ? (typeof p.fechaFinEstimada === 'string' ? p.fechaFinEstimada.split('T')[0] : new Date(p.fechaFinEstimada).toISOString().split('T')[0]) : '';
                const mappedProject = {
                  _id: p._id,
                  name: p.nombre,
                  nombre: p.nombre,
                  description: p.descripcion || '',
                  startDate: fechaInicio,
                  endDate: fechaFin,
                  difficulty: difficultyMap[p.nivelDificultad] || 'Media',
                  priority: priorityMap[(p.prioridad || '').toLowerCase()] || 'Media',
                  status: statusMap[(p.estado || '').toLowerCase()] || 'Pendiente',
                  fechaCreacion: p.fechaCreacion || new Date().toISOString()
                };
                uniqueProjects.set(p._id, mappedProject);
              }
            });
          }
          
          this.projects = Array.from(uniqueProjects.values());
          console.log('🔍 Proyectos - Proyectos del usuario cargados:', this.projects.length);
          console.log('🔍 Proyectos - Proyectos finales:', this.projects);
        }
        
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
          difficulty: 'Media', status: 'Pendiente', priority: 'Media'
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
      // Usar zona horaria local en lugar de UTC
      const todayString = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
      
      if (this.editableProject.startDate < todayString) {
        this.showAlert('La fecha de inicio no puede ser anterior a hoy', 'alert-warning');
        return;
      }

      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden guardar proyectos', 'alert-warning');
        return;
      }

      try {
        // Validar nivelDificultad primero
        const difficultyIndex = this.difficultyOptions.indexOf(this.editableProject.difficulty);
        if (difficultyIndex === -1) {
          this.showAlert('Nivel de dificultad inválido', 'alert-warning');
          return;
        }
        
        // Enviar datos en formato frontend, el ProjectService se encarga del mapeo
        const projectData = {
          name: this.editableProject.name,
          description: this.editableProject.description,
          startDate: this.editableProject.startDate,
          endDate: this.editableProject.endDate,
          difficulty: this.editableProject.difficulty,
          priority: this.editableProject.priority,
          status: this.editableProject.status
        };
        
        
        if (this.isEditMode) {
          await ProjectService.updateProject(this.editableProject._id, projectData);
          this.showAlert('Proyecto actualizado correctamente', 'alert-success');
        } else {
          await ProjectService.createProject(projectData);
          this.showAlert('Proyecto creado correctamente', 'alert-success');
        }
        this.loadProjects();
        this.closeModal();
      } catch (error) {
        console.error('Error saving project:', error);
        console.error('Error response:', error.response);
        console.error('Error response data:', error.response?.data);
        
        if (error.response?.status === 400 && error.response?.data?.error) {
          // Mostrar mensaje de error específico del backend
          this.showAlert(`Error del servidor: ${error.response.data.error}`, 'alert-danger');
        } else if (error.response?.status === 401) {
          this.showAlert('No tienes permisos para realizar esta acción', 'alert-danger');
        } else if (error.response?.status === 500) {
          this.showAlert(`Error interno del servidor: ${error.response?.data?.error || 'Error desconocido'}`, 'alert-danger');
        } else {
          this.showAlert(`Error al guardar el proyecto: ${error.message}`, 'alert-danger');
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
        // Usar zona horaria local en lugar de UTC
        const todayString = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');
        
        if (this.editableProject.startDate < todayString) {
          this.dateErrors.startDate = 'La fecha de inicio no puede ser anterior a hoy.';
        }
      }
    },
    async iniciarProyecto(projectId) {
      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden iniciar proyectos', 'alert-warning');
        return;
      }

      if (window.confirm('¿Estás seguro de que quieres iniciar este proyecto?')) {
        try {
          await ProjectService.iniciarProyecto(projectId);
          this.showAlert('Proyecto iniciado correctamente', 'alert-success');
          this.loadProjects();
        } catch (error) {
          console.error('Error iniciando proyecto:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          if (error.response?.status === 401) {
            this.showAlert('No tienes permisos para iniciar proyectos', 'alert-danger');
          } else if (error.response?.status === 400) {
            // Mostrar el mensaje específico del backend
            this.showAlert(`No se puede iniciar el proyecto: ${errorMessage}`, 'alert-warning');
          } else {
            this.showAlert(`Error al iniciar el proyecto: ${errorMessage}`, 'alert-danger');
          }
        }
      }
    },
    async pausarProyecto(projectId) {
      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden pausar proyectos', 'alert-warning');
        return;
      }

      if (window.confirm('¿Estás seguro de que quieres pausar este proyecto?')) {
        try {
          await ProjectService.pausarProyecto(projectId);
          this.showAlert('Proyecto pausado correctamente', 'alert-success');
          this.loadProjects();
        } catch (error) {
          console.error('Error pausando proyecto:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          if (error.response?.status === 401) {
            this.showAlert('No tienes permisos para pausar proyectos', 'alert-danger');
          } else if (error.response?.status === 400) {
            this.showAlert(`No se puede pausar el proyecto: ${errorMessage}`, 'alert-warning');
          } else {
            this.showAlert(`Error al pausar el proyecto: ${errorMessage}`, 'alert-danger');
          }
        }
      }
    },
    async finalizarProyecto(projectId) {
      if (!this.isUserAdmin) {
        this.showAlert('Solo los administradores pueden finalizar proyectos', 'alert-warning');
        return;
      }

      if (window.confirm('¿Estás seguro de que quieres finalizar este proyecto?')) {
        try {
          await ProjectService.finalizarProyecto(projectId);
          this.showAlert('Proyecto finalizado correctamente', 'alert-success');
          this.loadProjects();
        } catch (error) {
          console.error('Error finalizando proyecto:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          if (error.response?.status === 401) {
            this.showAlert('No tienes permisos para finalizar proyectos', 'alert-danger');
          } else if (error.response?.status === 400) {
            this.showAlert(`No se puede finalizar el proyecto: ${errorMessage}`, 'alert-warning');
          } else {
            this.showAlert(`Error al finalizar el proyecto: ${errorMessage}`, 'alert-danger');
          }
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

.proyectos-page {
  min-height: 100%;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%);
}

.proyectos-title {
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1a2332;
}

.proyectos-subtitle {
  font-size: 0.95rem;
}

.btn-create-project {
  font-weight: 600;
  padding: 0.55rem 1.15rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, #198754 0%, #157347 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(25, 135, 84, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-create-project:hover {
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(25, 135, 84, 0.45);
}

.proyectos-panel {
  background: #fff;
  border-radius: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.empty-state {
  border: 1px dashed rgba(15, 23, 42, 0.12);
}

.stat-card {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.stat-icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  margin-bottom: 0.65rem;
}

.stat-icon-total {
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
}

.stat-icon-pend {
  background: rgba(255, 193, 7, 0.2);
  color: #b8860b;
}

.stat-icon-curso {
  background: rgba(13, 110, 253, 0.12);
  color: #0d6efd;
}

.stat-icon-fin {
  background: rgba(25, 135, 84, 0.15);
  color: #146c43;
}

.stat-value {
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.1;
  color: #1a2332;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.15rem;
}

.filters-bar {
  padding: 1rem 1.15rem;
}

.input-group-search .form-control:focus {
  box-shadow: none;
  border-color: #dee2e6;
}

.input-group-search:focus-within {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  border-radius: 0.5rem;
}

.input-group-search:focus-within .form-control,
.input-group-search:focus-within .input-group-text {
  border-color: #86b7fe;
}

.project-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
}

@media (min-width: 768px) {
  .project-card {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.project-card-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  justify-content: space-between;
}

.project-name {
  color: #1e293b;
  font-weight: 600;
  line-height: 1.35;
  flex: 1;
  min-width: 0;
}

.status-dot {
  font-size: 0.45rem;
  vertical-align: middle;
  opacity: 0.85;
}

.project-meta {
  line-height: 1.6;
}

.progress-thin {
  height: 0.45rem;
  border-radius: 100px;
  background-color: #e9ecef;
}

.project-card-actions {
  padding-top: 0.25rem;
}

.btn-view {
  font-weight: 600;
  border-radius: 0.5rem;
}

.btn-icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

/* Validación de fechas (modal) */
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

.alert {
  margin-bottom: 1rem;
  border-radius: 0.5rem;
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
