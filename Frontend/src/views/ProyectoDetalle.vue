<template>
  <div class="project-detail-container">
    <!-- Header del Proyecto -->
    <div class="project-header">
      <div class="project-info">
        <h1 class="project-title">{{ project?.name || 'Cargando...' }}</h1>
        <div class="project-meta">
          <div class="priority-section">
            <span class="priority-label">Prioridad:</span>
            <span class="priority-badge" :class="getPriorityClass(project?.priority)">
              {{ getPriorityText(project?.priority) }}
            </span>
          </div>
        </div>
      </div>
      <div class="project-actions">
        <button class="btn btn-primary add-task-btn" @click="showAddTaskModal = true">
          <i class="bi bi-plus-circle me-2"></i>
          Agregar Tarea
        </button>
      </div>
    </div>

    <!-- Tabs de Navegación -->
    <div class="tabs-container">
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'descripcion' }"
          @click="activeTab = 'descripcion'"
        >
          Descripción
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'tareas' }"
          @click="activeTab = 'tareas'"
        >
          Tareas
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'equipo' }"
          @click="activeTab = 'equipo'"
        >
          Equipo
        </button>
      </div>
    </div>

    <!-- Contenido de los Tabs -->
    <div class="tab-content">
      <!-- Tab Descripción -->
      <div v-if="activeTab === 'descripcion'" class="tab-pane active">
        <div class="description-content">
          <div class="description-box">
            <h3>Descripción del Proyecto</h3>
            <p>{{ project?.description || 'No hay descripción disponible para este proyecto.' }}</p>
          </div>
          
          <div class="project-details">
            <div class="detail-item">
              <strong>Fecha de Inicio:</strong> {{ formatDate(project?.startDate) }}
            </div>
            <div class="detail-item">
              <strong>Fecha de Fin:</strong> {{ formatDate(project?.endDate) }}
            </div>
            <div class="detail-item">
              <strong>Dificultad:</strong> {{ project?.difficulty }}
            </div>
            <div class="detail-item">
              <strong>Estado:</strong> 
              <span class="status-badge" :class="getStatusClass(project?.status)">
                {{ project?.status }}
              </span>
            </div>
            <div class="detail-item">
              <strong>Fecha de Creación:</strong> {{ formatCreationDate(project?.fechaCreacion) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Tareas -->
      <div v-if="activeTab === 'tareas'" class="tab-pane active">
        <div class="tasks-content">
          <div class="tasks-header">
            <h3>Tareas del Proyecto</h3>
            <button class="btn btn-success btn-sm" @click="showAddTaskModal = true">
              <i class="bi bi-plus-circle me-1"></i>
              Nueva Tarea
            </button>
          </div>
          
          <div v-if="projectTasks.length === 0" class="no-tasks">
            <i class="bi bi-clipboard-x fs-1 text-muted"></i>
            <p>No hay tareas asignadas a este proyecto.</p>
            <button class="btn btn-primary" @click="showAddTaskModal = true">
              Crear Primera Tarea
            </button>
          </div>
          
          <div v-else class="tasks-grid">
            <div v-for="task in projectTasks" :key="task._id" class="task-card">
              <div class="task-header">
                <h5 class="task-title">{{ task.descripcion }}</h5>
                <span class="task-priority" :class="getTaskPriorityClass(task.prioridad)">
                  {{ getTaskPriorityText(task.prioridad) }}
                </span>
              </div>
              <div class="task-body">
                <div class="task-info">
                  <span class="task-status" :class="getTaskStatusClass(task.estado)">
                    {{ getTaskStatusText(task.estado) }}
                  </span>
                  <span class="task-deadline">
                    <i class="bi bi-calendar-event me-1"></i>
                    {{ formatDate(task.plazoEntrega) }}
                  </span>
                </div>
                <div class="task-assignee" v-if="task.desarrolladorAsignado">
                  <i class="bi bi-person me-1"></i>
                  {{ getDeveloperName(task.desarrolladorAsignado) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Equipo -->
      <div v-if="activeTab === 'equipo'" class="tab-pane active">
        <div class="team-content">
          <div class="team-header">
            <h3>Equipo del Proyecto</h3>
            <button class="btn btn-success btn-sm" @click="showAddTeamModal = true">
              <i class="bi bi-person-plus me-1"></i>
              Agregar Miembro
            </button>
          </div>
          
          <div v-if="!project?.team || project.team.length === 0" class="no-team">
            <i class="bi bi-people fs-1 text-muted"></i>
            <p>No hay miembros asignados a este proyecto.</p>
            <button class="btn btn-primary" @click="showAddTeamModal = true">
              Asignar Primer Miembro
            </button>
          </div>
          
          <div v-else class="team-grid">
            <div v-for="member in project.team" :key="member.usuario._id" class="team-member-card">
              <div class="member-avatar">
                <i class="bi bi-person-circle fs-1"></i>
              </div>
              <div class="member-info">
                <h6 class="member-name">{{ member.usuario.nombre }} {{ member.usuario.apellido }}</h6>
                <span class="member-role">{{ member.rol }}</span>
                <span class="member-email">{{ member.usuario.email }}</span>
                <small class="member-date">Asignado: {{ formatDate(member.fechaAsignacion) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Agregar Tarea -->
    <div v-if="showAddTaskModal" class="modal-overlay" @click="showAddTaskModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5>Agregar Nueva Tarea</h5>
          <button class="btn-close" @click="showAddTaskModal = false"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createTask">
            <div class="mb-3">
              <label class="form-label">Descripción de la Tarea</label>
              <textarea class="form-control" v-model="newTask.descripcion" required></textarea>
            </div>
            <div class="row">
              <div class="col-md-6">
                <label class="form-label">Prioridad</label>
                <select class="form-select" v-model="newTask.prioridad" required>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Plazo de Entrega</label>
                <input type="date" class="form-control" v-model="newTask.plazoEntrega" required>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Habilidades Requeridas</label>
              <input type="text" class="form-control" v-model="newTask.habilidadesRequeridas" 
                     placeholder="JavaScript, React, Node.js">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showAddTaskModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Tarea</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Botón Volver -->
    <div class="back-button">
      <router-link to="/proyectos" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i>
        Volver a Proyectos
      </router-link>
    </div>
  </div>
</template>

<script>
import ProjectService from '@/services/project.service.js';
import TaskService from '@/services/task.service.js';

export default {
  name: 'ProyectoDetalleView',
  data() {
    return {
      project: null,
      projectTasks: [],
      activeTab: 'descripcion',
      showAddTaskModal: false,
      newTask: {
        descripcion: '',
        prioridad: 'media',
        plazoEntrega: '',
        habilidadesRequeridas: '',
        proyecto: null
      }
    };
  },
  async mounted() {
    await this.loadProject();
    await this.loadProjectTasks();
  },
  methods: {
    async loadProject() {
      try {
        const projectId = this.$route.params.id;
        const response = await ProjectService.getProjectById(projectId);
        this.project = response.data;
        this.newTask.proyecto = projectId;
      } catch (error) {
        console.error('Error cargando proyecto:', error);
      }
    },
    
    async loadProjectTasks() {
      try {
        const projectId = this.$route.params.id;
        const tasks = await TaskService.getTasksByProject(projectId);
        this.projectTasks = tasks;
      } catch (error) {
        console.error('Error cargando tareas:', error);
        this.projectTasks = [];
      }
    },
    
    async createTask() {
      try {
        await TaskService.createTask(this.newTask);
        this.showAddTaskModal = false;
        this.newTask = {
          descripcion: '',
          prioridad: 'media',
          plazoEntrega: '',
          habilidadesRequeridas: '',
          proyecto: this.$route.params.id
        };
        await this.loadProjectTasks();
      } catch (error) {
        console.error('Error creando tarea:', error);
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('es-ES');
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
    
    getPriorityClass(priority) {
      if (priority === 'Alta') return 'priority-high';
      if (priority === 'Media') return 'priority-medium';
      return 'priority-low';
    },
    
    getPriorityText(priority) {
      if (priority === 'Alta') return 'ALTA';
      if (priority === 'Media') return 'MEDIA';
      return 'BAJA';
    },
    
    getStatusClass(status) {
      if (status === 'Activo') return 'status-active';
      if (status === 'Pausado') return 'status-paused';
      return 'status-finished';
    },
    
    getTaskPriorityClass(priority) {
      if (priority === 'alta') return 'priority-high';
      if (priority === 'media') return 'priority-medium';
      return 'priority-low';
    },
    
    getTaskPriorityText(priority) {
      if (priority === 'alta') return 'ALTA';
      if (priority === 'media') return 'MEDIA';
      return 'BAJA';
    },
    
    getTaskStatusClass(status) {
      if (status === 'completada') return 'status-completed';
      if (status === 'en curso') return 'status-in-progress';
      return 'status-pending';
    },
    
    getTaskStatusText(status) {
      if (status === 'completada') return 'Completada';
      if (status === 'en curso') return 'En Progreso';
      return 'Pendiente';
    },
    
    getDeveloperName(developerId) {
      // Por ahora retornamos el ID, pero podríamos buscar en una lista de usuarios
      return developerId || 'Sin asignar';
    }
  }
}
</script>

<style scoped>
.project-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header del Proyecto */
.project-header {
  background: linear-gradient(135deg, #fd7e14 0%, #ffc107 100%);
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.project-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.project-meta {
  margin-top: 1rem;
}

.priority-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.priority-label {
  font-weight: 600;
}

.priority-badge {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
}

.priority-high {
  background: #dc3545;
  color: white;
}

.priority-medium {
  background: #ffc107;
  color: #212529;
}

.priority-low {
  background: #28a745;
  color: white;
}

.add-task-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.add-task-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* Tabs */
.tabs-container {
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  gap: 0;
}

.tab-btn {
  background: none;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  color: #495057;
}

.tab-btn.active {
  color: #dc3545;
  border-bottom-color: #dc3545;
}

/* Contenido de los Tabs */
.tab-content {
  background: #f8f9fa;
  border-radius: 1rem;
  padding: 2rem;
  min-height: 400px;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

/* Tab Descripción */
.description-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.description-box {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.description-box h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.project-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid #007bff;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-paused {
  background: #fff3cd;
  color: #856404;
}

.status-finished {
  background: #d1ecf1;
  color: #0c5460;
}

/* Tab Tareas */
.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.no-tasks {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.task-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007bff;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-title {
  margin: 0;
  font-size: 1.1rem;
  color: #495057;
}

.task-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.task-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.task-status {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-in-progress {
  background: #fff3cd;
  color: #856404;
}

.status-pending {
  background: #e2e3e5;
  color: #495057;
}

.task-deadline {
  color: #6c757d;
  font-size: 0.875rem;
}

.task-assignee {
  color: #007bff;
  font-weight: 600;
}

/* Tab Equipo */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.no-team {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.team-member-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.member-avatar {
  margin-bottom: 1rem;
  color: #007bff;
}

.member-name {
  color: #495057;
  margin-bottom: 0.5rem;
}

.member-role {
  display: block;
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.member-email {
  display: block;
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.member-date {
  color: #adb5bd;
  font-size: 0.75rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Botón Volver */
.back-button {
  margin-top: 2rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .project-detail-container {
    padding: 1rem;
  }
  
  .project-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .project-title {
    font-size: 2rem;
  }
  
  .description-content {
    grid-template-columns: 1fr;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
}
</style>
