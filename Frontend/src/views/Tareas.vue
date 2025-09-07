<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>Gestión de Tareas</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="bi bi-plus-circle me-1"></i>Crear Nueva Tarea
      </button>
    </div>

    <!-- Filtros -->
    <div class="row mb-4">
      <div class="col-md-4">
        <label for="projectFilter" class="form-label">Filtrar por Proyecto</label>
        <select class="form-select" id="projectFilter" v-model="selectedProject" @change="loadTasks">
          <option value="">Todos los proyectos</option>
          <option v-for="project in projects" :key="project._id" :value="project._id">
            {{ project.nombre }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <label for="statusFilter" class="form-label">Filtrar por Estado</label>
        <select class="form-select" id="statusFilter" v-model="selectedStatus" @change="filterTasks">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en curso">En Curso</option>
          <option value="completada">Completada</option>
        </select>
      </div>
      <div class="col-md-4">
        <label for="priorityFilter" class="form-label">Filtrar por Prioridad</label>
        <select class="form-select" id="priorityFilter" v-model="selectedPriority" @change="filterTasks">
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>
    </div>

    <!-- Tabla de Tareas -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-else-if="filteredTasks.length === 0" class="text-center py-4 text-muted">
          No hay tareas disponibles
        </div>
        <div v-else>
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Descripción</th>
                <th scope="col">Proyecto</th>
                <th scope="col">Asignada a</th>
                <th scope="col">Estado</th>
                <th scope="col">Prioridad</th>
                <th scope="col">Dificultad</th>
                <th scope="col">Plazo</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in filteredTasks" :key="task._id">
                <td>
                  <div class="fw-bold">{{ task.descripcion }}</div>
                  <small class="text-muted" v-if="task.habilidadesRequeridas && task.habilidadesRequeridas.length > 0">
                    Habilidades: {{ task.habilidadesRequeridas.join(', ') }}
                  </small>
                </td>
                <td>{{ getProjectName(task.proyecto) }}</td>
                <td>
                  <span v-if="task.desarrolladorAsignado">
                    {{ task.desarrolladorAsignado.nombre || task.desarrolladorAsignado.email }}
                  </span>
                  <span v-else class="text-muted">Sin asignar</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusClass(task.estado)">
                    {{ getStatusText(task.estado) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getPriorityClass(task.prioridad)">
                    {{ getPriorityText(task.prioridad) }}
                  </span>
                </td>
                <td>
                  <span class="badge bg-info">{{ task.nivelDificultad }}/5</span>
                </td>
                <td>
                  <span v-if="task.fechaEstimadaFin">
                    {{ formatDate(task.fechaEstimadaFin) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" @click="viewTask(task)" title="Ver detalles">
                      <i class="bi bi-eye"></i>
                    </button>
                    <!-- Temporalmente deshabilitado por problema de CORS -->
                    <!-- <button 
                      class="btn btn-sm btn-outline-warning" 
                      @click="editTask(task)" 
                      title="Editar"
                    >
                      <i class="bi bi-pencil"></i>
                    </button> -->
                    <button 
                      class="btn btn-sm btn-outline-danger" 
                      @click="deleteTask(task)" 
                      title="Eliminar"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para Crear/Editar Tarea -->
    <div class="modal fade" id="taskModal" tabindex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="taskModalLabel">
              {{ isEditing ? 'Editar Tarea' : 'Crear Nueva Tarea' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTask">
              <div class="row">
                <div class="col-md-8 mb-3">
                  <label for="taskDescription" class="form-label">Descripción *</label>
                  <textarea 
                    class="form-control" 
                    id="taskDescription" 
                    v-model="taskForm.descripcion" 
                    rows="3"
                    required
                  ></textarea>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="taskProject" class="form-label">Proyecto *</label>
                  <select class="form-select" id="taskProject" v-model="taskForm.proyecto" required>
                    <option value="">Seleccionar proyecto</option>
                    <option v-for="project in projects" :key="project._id" :value="project._id">
                      {{ project.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="taskSkills" class="form-label">Habilidades Requeridas *</label>
                  <div class="input-group">
                    <input 
                      type="text" 
                      class="form-control" 
                      id="taskSkills" 
                      v-model="skillInput"
                      @keyup.enter="addSkill"
                      placeholder="Escribir habilidad y presionar Enter"
                    >
                    <button type="button" class="btn btn-outline-secondary" @click="addSkill">
                      <i class="bi bi-plus"></i>
                    </button>
                  </div>
                  <div class="mt-2">
                    <span 
                      v-for="(skill, index) in taskForm.habilidadesRequeridas" 
                      :key="index" 
                      class="badge bg-primary me-1 mb-1"
                    >
                      {{ skill }}
                      <button 
                        type="button" 
                        class="btn-close btn-close-white ms-1" 
                        @click="removeSkill(index)"
                        style="font-size: 0.7em;"
                      ></button>
                    </span>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="taskDeveloper" class="form-label">Desarrollador Asignado</label>
                  <select class="form-select" id="taskDeveloper" v-model="taskForm.desarrolladorAsignado">
                    <option value="">Sin asignar</option>
                    <option v-for="user in users" :key="user._id" :value="user._id">
                      {{ user.nombre || user.email }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="taskDifficulty" class="form-label">Nivel de Dificultad *</label>
                  <select class="form-select" id="taskDifficulty" v-model="taskForm.nivelDificultad" required>
                    <option value="">Seleccionar</option>
                    <option value="1">1 - Muy Fácil</option>
                    <option value="2">2 - Fácil</option>
                    <option value="3">3 - Intermedio</option>
                    <option value="4">4 - Difícil</option>
                    <option value="5">5 - Muy Difícil</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="taskPriority" class="form-label">Prioridad *</label>
                  <select class="form-select" id="taskPriority" v-model="taskForm.prioridad" required>
                    <option value="">Seleccionar</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="taskStatus" class="form-label">Estado</label>
                  <select class="form-select" id="taskStatus" v-model="taskForm.estado">
                    <option value="pendiente">Pendiente</option>
                    <option value="en curso">En Curso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="taskEstimatedHours" class="form-label">Tiempo Estimado (horas)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="taskEstimatedHours" 
                    v-model="taskForm.tiempoEstimadoHoras"
                    min="0"
                    step="0.5"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="taskDeadline" class="form-label">Fecha Límite</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="taskDeadline" 
                    v-model="taskForm.fechaEstimadaFin"
                  >
                </div>
              </div>

              <div class="alert alert-danger" v-if="errorMessage">
                {{ errorMessage }}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="saveTask" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ isEditing ? 'Actualizar' : 'Crear' }} Tarea
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Ver Detalles -->
    <div class="modal fade" id="viewTaskModal" tabindex="-1" aria-labelledby="viewTaskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewTaskModalLabel">Detalles de la Tarea</h5>
            <button type="button" class="btn-close" @click="closeViewModal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedTask">
            <div class="row">
              <div class="col-md-8">
                <h6>Descripción</h6>
                <p>{{ selectedTask.descripcion }}</p>
                
                <h6>Habilidades Requeridas</h6>
                <div v-if="selectedTask.habilidadesRequeridas && selectedTask.habilidadesRequeridas.length > 0">
                  <span 
                    v-for="skill in selectedTask.habilidadesRequeridas" 
                    :key="skill" 
                    class="badge bg-primary me-1 mb-1"
                  >
                    {{ skill }}
                  </span>
                </div>
                <p v-else class="text-muted">No especificadas</p>
              </div>
              <div class="col-md-4">
                <h6>Información General</h6>
                <p><strong>Proyecto:</strong> {{ getProjectName(selectedTask.proyecto) }}</p>
                <p><strong>Asignado a:</strong> 
                  <span v-if="selectedTask.desarrolladorAsignado">
                    {{ selectedTask.desarrolladorAsignado.nombre || selectedTask.desarrolladorAsignado.email }}
                  </span>
                  <span v-else class="text-muted">Sin asignar</span>
                </p>
                <p><strong>Estado:</strong> 
                  <span class="badge" :class="getStatusClass(selectedTask.estado)">
                    {{ getStatusText(selectedTask.estado) }}
                  </span>
                </p>
                <p><strong>Prioridad:</strong> 
                  <span class="badge" :class="getPriorityClass(selectedTask.prioridad)">
                    {{ getPriorityText(selectedTask.prioridad) }}
                  </span>
                </p>
                <p><strong>Dificultad:</strong> 
                  <span class="badge bg-info">{{ selectedTask.nivelDificultad }}/5</span>
                </p>
                <p v-if="selectedTask.tiempoEstimadoHoras">
                  <strong>Tiempo Estimado:</strong> {{ selectedTask.tiempoEstimadoHoras }} horas
                </p>
                <p v-if="selectedTask.fechaEstimadaFin">
                  <strong>Fecha Límite:</strong> {{ formatDate(selectedTask.fechaEstimadaFin) }}
                </p>
                <p v-if="selectedTask.fechaCreacion">
                  <strong>Creada:</strong> {{ formatDate(selectedTask.fechaCreacion) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import TaskService from '../services/task.service.js';
import ProjectService from '../services/project.service.js';
import UserService from '../services/user.service.js';
import AuthService from '../services/auth.service.js';

export default {
  name: 'TareasView',
  data() {
    return {
      // Modales
      taskModalInstance: null,
      viewModalInstance: null,
      
      // Datos
      tasks: [],
      filteredTasks: [],
      projects: [],
      users: [],
      user: null,
      
      // Estados
      loading: false,
      saving: false,
      isEditing: false,
      errorMessage: '',
      
      // Filtros
      selectedProject: '',
      selectedStatus: '',
      selectedPriority: '',
      
      // Formulario de tarea
      taskForm: {
        descripcion: '',
        habilidadesRequeridas: [],
        nivelDificultad: '',
        prioridad: '',
        estado: 'pendiente',
        proyecto: '',
        desarrolladorAsignado: '',
        tiempoEstimadoHoras: null,
        fechaEstimadaFin: ''
      },
      
      // Input para habilidades
      skillInput: '',
      
      // Tarea seleccionada para ver detalles
      selectedTask: null
    };
  },
  async mounted() {
    this.taskModalInstance = new Modal(document.getElementById('taskModal'));
    this.viewModalInstance = new Modal(document.getElementById('viewTaskModal'));
    
    // Cargar usuario actual
    this.user = await AuthService.getCurrentUser();
    
    // Cargar datos iniciales
    await this.loadProjects();
    await this.loadUsers();
    await this.loadTasks();
  },
  methods: {
    // Cargar proyectos
    async loadProjects() {
      try {
        const response = await ProjectService.getProjects();
        this.projects = response.data || [];
      } catch (error) {
        console.error('Error cargando proyectos:', error);
        this.projects = [];
      }
    },
    
    // Cargar usuarios
    async loadUsers() {
      try {
        const response = await UserService.getUsers();
        this.users = response.data || [];
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        this.users = [];
      }
    },
    
    // Cargar tareas
    async loadTasks() {
      this.loading = true;
      try {
        if (this.selectedProject) {
          // Cargar tareas de un proyecto específico
          const tasks = await TaskService.getTasksByProject(this.selectedProject);
          this.tasks = tasks || [];
        } else {
          // Cargar todas las tareas (de todos los proyectos)
          this.tasks = [];
          for (const project of this.projects) {
            try {
              const tasks = await TaskService.getTasksByProject(project._id);
              if (tasks && tasks.length > 0) {
                this.tasks = this.tasks.concat(tasks);
              }
            } catch (error) {
              console.error(`Error cargando tareas del proyecto ${project._id}:`, error);
            }
          }
        }
        this.filterTasks();
      } catch (error) {
        console.error('Error cargando tareas:', error);
        this.tasks = [];
      } finally {
        this.loading = false;
      }
    },
    
    // Filtrar tareas
    filterTasks() {
      this.filteredTasks = this.tasks.filter(task => {
        const statusMatch = !this.selectedStatus || task.estado === this.selectedStatus;
        const priorityMatch = !this.selectedPriority || task.prioridad === this.selectedPriority;
        return statusMatch && priorityMatch;
      });
    },
    
    // Abrir modal de creación
    openCreateModal() {
      this.isEditing = false;
      this.resetForm();
      this.taskModalInstance.show();
    },
    
    // Abrir modal de edición
    editTask(task) {
      this.isEditing = true;
      this.taskForm = {
        _id: task._id, // Guardar el ID de la tarea
        descripcion: task.descripcion || '',
        habilidadesRequeridas: [...(task.habilidadesRequeridas || [])],
        nivelDificultad: task.nivelDificultad ? task.nivelDificultad.toString() : '',
        prioridad: task.prioridad || '',
        estado: task.estado || 'pendiente',
        proyecto: task.proyecto || '',
        desarrolladorAsignado: task.desarrolladorAsignado || '',
        tiempoEstimadoHoras: task.tiempoEstimadoHoras || null,
        fechaEstimadaFin: task.fechaEstimadaFin ? this.formatDateForInput(task.fechaEstimadaFin) : ''
      };
      this.taskModalInstance.show();
    },
    
    // Ver detalles de tarea
    viewTask(task) {
      this.selectedTask = task;
      this.viewModalInstance.show();
    },
    
    // Guardar tarea
    async saveTask() {
      this.saving = true;
      this.errorMessage = '';
      
      try {
        // Validaciones
        if (!this.taskForm.descripcion.trim()) {
          throw new Error('La descripción es obligatoria');
        }
        if (!this.taskForm.proyecto) {
          throw new Error('Debe seleccionar un proyecto');
        }
        if (!this.taskForm.nivelDificultad) {
          throw new Error('Debe seleccionar un nivel de dificultad');
        }
        if (!this.taskForm.prioridad) {
          throw new Error('Debe seleccionar una prioridad');
        }
        if (this.taskForm.habilidadesRequeridas.length === 0) {
          throw new Error('Debe agregar al menos una habilidad requerida');
        }
        
        // Preparar datos para envío
        console.log('this.taskForm antes de crear taskData:', this.taskForm);
        const taskData = {
          ...this.taskForm,
          nivelDificultad: parseInt(this.taskForm.nivelDificultad),
          desarrolladorAsignado: this.taskForm.desarrolladorAsignado || null,
          tiempoEstimadoHoras: this.taskForm.tiempoEstimadoHoras || null,
          fechaEstimadaFin: this.taskForm.fechaEstimadaFin || null
        };
        console.log('taskData creado:', taskData);
        
        if (this.isEditing) {
          // Actualizar tarea existente
          console.log('Actualizando tarea:', this.taskForm._id, taskData);
          await TaskService.updateTask(this.taskForm._id, taskData);
        } else {
          // Crear nueva tarea
          // Extraer el projectId ANTES de crear taskData
          const projectId = this.taskForm.proyecto;
          console.log('ProjectId extraído:', projectId);
          console.log('Tipo de projectId:', typeof projectId);
          
          // Crear taskData sin el campo proyecto (ya que va en la URL)
          const taskDataForAPI = {
            descripcion: this.taskForm.descripcion,
            habilidadesRequeridas: this.taskForm.habilidadesRequeridas,
            nivelDificultad: parseInt(this.taskForm.nivelDificultad),
            prioridad: this.taskForm.prioridad,
            estado: this.taskForm.estado,
            desarrolladorAsignado: this.taskForm.desarrolladorAsignado || null,
            tiempoEstimadoHoras: this.taskForm.tiempoEstimadoHoras || null,
            fechaEstimadaFin: this.taskForm.fechaEstimadaFin || null
          };
          
          console.log('Creando tarea para proyecto:', projectId);
          console.log('Datos de la tarea:', taskDataForAPI);
          await TaskService.createTask(projectId, taskDataForAPI);
        }
        
        // Recargar tareas y cerrar modal
        await this.loadTasks();
        this.closeModal();
        
      } catch (error) {
        console.error('Error guardando tarea:', error);
        this.errorMessage = error.response?.data?.error || error.message || 'Error al guardar la tarea';
      } finally {
        this.saving = false;
      }
    },
    
    // Eliminar tarea
    async deleteTask(task) {
      if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        try {
          await TaskService.deleteTask(task._id);
          await this.loadTasks();
        } catch (error) {
          console.error('Error eliminando tarea:', error);
          alert('Error al eliminar la tarea: ' + (error.response?.data?.error || error.message));
        }
      }
    },
    
    // Agregar habilidad
    addSkill() {
      const skill = this.skillInput.trim();
      if (skill && !this.taskForm.habilidadesRequeridas.includes(skill)) {
        this.taskForm.habilidadesRequeridas.push(skill);
        this.skillInput = '';
      }
    },
    
    // Remover habilidad
    removeSkill(index) {
      this.taskForm.habilidadesRequeridas.splice(index, 1);
    },
    
    // Cerrar modales
    closeModal() {
      this.taskModalInstance.hide();
      this.resetForm();
    },
    
    closeViewModal() {
      this.viewModalInstance.hide();
      this.selectedTask = null;
    },
    
    // Resetear formulario
    resetForm() {
      this.taskForm = {
        _id: null,
        descripcion: '',
        habilidadesRequeridas: [],
        nivelDificultad: '',
        prioridad: '',
        estado: 'pendiente',
        proyecto: '',
        desarrolladorAsignado: '',
        tiempoEstimadoHoras: null,
        fechaEstimadaFin: ''
      };
      this.skillInput = '';
      this.errorMessage = '';
    },
    
    // Utilidades
    getProjectName(projectId) {
      const project = this.projects.find(p => p._id === projectId);
      return project ? project.nombre : 'Proyecto no encontrado';
    },
    
    getStatusClass(status) {
      const classes = {
        'pendiente': 'bg-secondary',
        'en curso': 'bg-warning text-dark',
        'completada': 'bg-success'
      };
      return classes[status] || 'bg-light';
    },
    
    getStatusText(status) {
      const texts = {
        'pendiente': 'Pendiente',
        'en curso': 'En Curso',
        'completada': 'Completada'
      };
      return texts[status] || status;
    },
    
    getPriorityClass(priority) {
      const classes = {
        'baja': 'bg-success',
        'media': 'bg-warning text-dark',
        'alta': 'bg-danger'
      };
      return classes[priority] || 'bg-light';
    },
    
    getPriorityText(priority) {
      const texts = {
        'baja': 'Baja',
        'media': 'Media',
        'alta': 'Alta'
      };
      return texts[priority] || priority;
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    },
    
    formatDateForInput(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    }
  }
}
</script>

<style scoped>
/* Botones de acción */
.btn-group .btn {
  margin-right: 2px;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

/* Estilos para la tabla */
.table th {
  background-color: #f8f9fa;
  border-top: none;
  font-weight: 600;
}

.table td {
  vertical-align: middle;
}

/* Estilos para badges */
.badge {
  font-size: 0.75em;
  padding: 0.4em 0.6em;
  font-weight: 500;
}

/* Estilos para habilidades */
.badge.bg-primary {
  position: relative;
  padding-right: 1.5em;
}

.badge .btn-close {
  position: absolute;
  right: 0.2em;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.6em;
  padding: 0;
  background: none;
  border: none;
  color: white;
  opacity: 0.8;
}

.badge .btn-close:hover {
  opacity: 1;
}

/* Estilos para filtros */
.form-select {
  border-radius: 0.375rem;
}

/* Estilos para modales */
.modal-dialog {
  max-width: 800px;
}

.modal-lg {
  max-width: 900px;
}

/* Estilos para el formulario */
.form-label {
  font-weight: 500;
  color: #495057;
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Estilos para el input de habilidades */
.input-group .btn {
  border-left: 0;
}

.input-group .form-control:focus + .btn {
  border-color: #0d6efd;
}

/* Estilos para loading */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Estilos para alertas */
.alert {
  border-radius: 0.5rem;
  border: none;
}

/* Estilos para el estado vacío */
.text-muted {
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .btn-group .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .badge {
    font-size: 0.65em;
    padding: 0.3em 0.5em;
  }
}

/* Estilos para la descripción de tareas */
.fw-bold {
  color: #212529;
  line-height: 1.4;
}

/* Estilos para el modal de detalles */
.modal-body h6 {
  color: #495057;
  font-weight: 600;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

.modal-body h6:first-child {
  margin-top: 0;
}

.modal-body p {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}
</style>
