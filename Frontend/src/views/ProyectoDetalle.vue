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
          
          <div v-else class="tasks-table-container">
            <table class="table table-striped table-hover tasks-table">
              <thead class="table-dark">
                <tr>
                  <th>Descripción</th>
                  <th>Asignada a</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Dificultad</th>
                  <th>Plazo</th>
                  <th>Habilidades</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in projectTasks" :key="task._id">
                  <td>
                    <div class="task-description">
                      {{ task.descripcion }}
                    </div>
                  </td>
                  <td>
                    <span v-if="task.desarrolladorAsignado" class="task-assignee">
                      <i class="bi bi-person me-1"></i>
                      {{ getDeveloperName(task.desarrolladorAsignado) }}
                    </span>
                    <span v-else class="text-muted">Sin asignar</span>
                  </td>
                  <td>
                    <span class="badge" :class="getTaskStatusClass(task.estado)">
                      {{ getTaskStatusText(task.estado) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getTaskPriorityClass(task.prioridad)">
                      {{ getTaskPriorityText(task.prioridad) }}
                    </span>
                  </td>
                  <td>
                    <span class="difficulty-badge">
                      {{ task.nivelDificultad || 3 }}/5
                    </span>
                  </td>
                  <td>
                    <span class="task-deadline">
                      <i class="bi bi-calendar-event me-1"></i>
                      {{ formatDate(task.fechaEstimadaFin) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="task.habilidadesRequeridas && task.habilidadesRequeridas.length > 0" class="skills-badge">
                      {{ task.habilidadesRequeridas.join(', ') }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <div class="task-actions">
                      <button class="btn btn-sm btn-outline-info me-1" @click="viewTask(task)" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-1" @click="editTask(task)" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteTask(task)" title="Eliminar">
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

      <!-- Tab Equipo -->
      <div v-if="activeTab === 'equipo'" class="tab-pane active">
        <div class="team-content">
          <div class="team-header">
            <h3>Equipo de Trabajo</h3>
            <div class="team-info">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Equipo extraído automáticamente de las tareas asignadas
              </small>
            </div>
          </div>
          
          <div v-if="projectTeam.length === 0" class="no-team">
            <i class="bi bi-people fs-1 text-muted"></i>
            <p>No hay desarrolladores asignados a tareas en este proyecto.</p>
            <p class="text-muted small">El equipo aparecerá automáticamente cuando se asignen tareas a los desarrolladores.</p>
          </div>
          
          <div v-else class="team-grid">
            <div v-for="member in projectTeam" :key="member.usuario._id" class="team-member-card">
              <div class="member-avatar">
                <i class="bi bi-person-circle fs-1"></i>
              </div>
              <div class="member-info">
                <h6 class="member-name">{{ member.usuario.nombre }}</h6>
                <span class="member-role">{{ member.rol }}</span>
                <span class="member-email">{{ member.usuario.email }}</span>
                <div class="member-stats">
                  <span class="tasks-count">
                    <i class="bi bi-clipboard-check me-1"></i>
                    {{ member.tareasAsignadas }} {{ member.tareasAsignadas === 1 ? 'tarea' : 'tareas' }}
                  </span>
                  <small class="member-date">Asignado: {{ formatDate(member.fechaAsignacion) }}</small>
                </div>
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
          <h5>{{ isEditing ? 'Editar Tarea' : 'Agregar Nueva Tarea' }}</h5>
          <button class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createTask">
            <!-- Descripción -->
            <div class="mb-3">
              <label class="form-label">Descripción de la Tarea *</label>
              <textarea class="form-control" v-model="newTask.descripcion" required></textarea>
            </div>

            <!-- Habilidades Requeridas -->
            <div class="mb-3">
              <label class="form-label">Habilidades Requeridas *</label>
              
              <!-- Lista de habilidades disponibles -->
              <div v-if="availableSkills.length > 0" class="mb-3">
                <small class="text-muted">Habilidades disponibles:</small>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-primary"
                    v-for="skill in availableSkills" 
                    :key="skill._id || skill"
                    @click="addSkillFromList(skill.nombre || skill)"
                    :disabled="newTask.habilidadesRequeridas.includes(skill.nombre || skill)"
                    :title="newTask.habilidadesRequeridas.includes(skill.nombre || skill) ? 'Ya seleccionada' : 'Agregar habilidad'"
                  >
                    <i class="bi bi-plus-circle me-1"></i>
                    {{ skill.nombre || skill }}
                  </button>
                </div>
              </div>
              
              <!-- Input manual como alternativa -->
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="skillInput"
                  @keyup.enter="addSkill"
                  placeholder="O escribir habilidad personalizada y presionar Enter"
                >
                <button type="button" class="btn btn-outline-secondary" @click="addSkill">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
              
              <!-- Habilidades seleccionadas -->
              <div class="mt-2">
                <small class="text-muted">Habilidades seleccionadas:</small>
                <div class="mt-1">
                  <span 
                    v-for="(skill, index) in newTask.habilidadesRequeridas" 
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
            </div>

            <!-- Desarrollador Asignado -->
            <div class="mb-3">
              <label class="form-label">Desarrollador Asignado</label>
              <select class="form-select" v-model="newTask.desarrolladorAsignado">
                <option value="">Sin asignar</option>
                <option v-for="user in users" :key="user._id" :value="user._id">
                  {{ user.nombre || user.email }}
                </option>
              </select>
            </div>

            <!-- Nivel de Dificultad, Prioridad y Estado -->
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Nivel de Dificultad *</label>
                <select class="form-select" v-model="newTask.nivelDificultad" required>
                  <option value="">Seleccionar</option>
                  <option value="1">1 - Muy Fácil</option>
                  <option value="2">2 - Fácil</option>
                  <option value="3">3 - Intermedio</option>
                  <option value="4">4 - Difícil</option>
                  <option value="5">5 - Muy Difícil</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Prioridad *</label>
                <select class="form-select" v-model="newTask.prioridad" required>
                  <option value="">Seleccionar</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Estado</label>
                <select class="form-select" v-model="newTask.estado">
                  <option value="pendiente">Pendiente</option>
                  <option value="en curso">En Curso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
            </div>

            <!-- Tiempo Estimado e Invertido -->
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Tiempo Estimado (horas)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="newTask.tiempoEstimadoHoras"
                  min="0"
                  step="0.5"
                >
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Tiempo Invertido (horas)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="newTask.tiempoInvertidoHoras"
                  min="0"
                  step="0.5"
                >
              </div>
            </div>

            <!-- Fechas Estimadas -->
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Estimada de Inicio</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="newTask.fechaEstimadaInicio"
                >
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Estimada de Fin</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="newTask.fechaEstimadaFin"
                >
              </div>
            </div>

            <!-- Fechas Reales (solo para edición) -->
            <div v-if="isEditing" class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Real de Inicio</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="newTask.fechaRealInicio"
                  :readonly="true"
                >
                <small class="text-muted">Se establece automáticamente cuando cambia a "En Curso"</small>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Real de Fin</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="newTask.fechaRealFin"
                  :readonly="true"
                >
                <small class="text-muted">Se establece automáticamente cuando cambia a "Completada"</small>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary">{{ isEditing ? 'Actualizar Tarea' : 'Crear Tarea' }}</button>
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
import SkillsService from '@/services/skills.service.js';
import UserService from '@/services/user.service.js';
import ValidationService from '@/services/validation.service.js';

export default {
  name: 'ProyectoDetalleView',
  data() {
    return {
      project: null,
      projectTasks: [],
      activeTab: 'descripcion',
      showAddTaskModal: false,
      isEditing: false,
      newTask: {
        descripcion: '',
        prioridad: 'media',
        nivelDificultad: '',
        estado: 'pendiente',
        desarrolladorAsignado: '',
        tiempoEstimadoHoras: null,
        tiempoInvertidoHoras: 0,
        fechaEstimadaInicio: '',
        fechaEstimadaFin: '',
        fechaRealInicio: '',
        fechaRealFin: '',
        habilidadesRequeridas: [],
        proyecto: null,
        _id: null
      },
      // Habilidades disponibles
      availableSkills: [],
      // Input para habilidades
      skillInput: '',
      // Lista de usuarios para asignación
      users: []
    };
  },
  computed: {
    // Equipo de trabajo extraído de las tareas asignadas
    projectTeam() {
      const teamMap = new Map();
      
      this.projectTasks.forEach(task => {
        if (task.desarrolladorAsignado) {
          let developer;
          
          // Si el desarrollador es un objeto populado
          if (typeof task.desarrolladorAsignado === 'object' && task.desarrolladorAsignado._id) {
            developer = task.desarrolladorAsignado;
          } else {
            // Si es solo un ID, crear un objeto básico
            developer = {
              _id: task.desarrolladorAsignado,
              nombre: 'Desarrollador',
              email: 'email@ejemplo.com'
            };
          }
          
          // Agregar al mapa si no existe
          if (!teamMap.has(developer._id)) {
            teamMap.set(developer._id, {
              usuario: developer,
              rol: 'Desarrollador',
              fechaAsignacion: new Date().toISOString(),
              tareasAsignadas: 1
            });
          } else {
            // Incrementar contador de tareas
            teamMap.get(developer._id).tareasAsignadas++;
          }
        }
      });
      
      return Array.from(teamMap.values());
    }
  },
  async mounted() {
    await this.loadProject();
    await this.loadProjectTasks();
    await this.loadSkills();
    await this.loadUsers();
  },
  methods: {
    async loadProject() {
      try {
        const projectId = this.$route.params.id;
        console.log('🔍 ProyectoDetalle - Cargando proyecto con ID:', projectId);
        const response = await ProjectService.getProjectById(projectId);
        console.log('🔍 ProyectoDetalle - Proyecto recibido:', response.data);
        this.project = response.data;
        this.newTask.proyecto = projectId;
      } catch (error) {
        console.error('Error cargando proyecto:', error);
      }
    },
    
    async loadProjectTasks() {
      try {
        const projectId = this.$route.params.id;
        console.log('🔍 ProyectoDetalle - Cargando tareas para proyecto:', projectId);
        const tasks = await TaskService.getTasksByProject(projectId);
        console.log('🔍 ProyectoDetalle - Tareas recibidas del backend:', tasks);
        console.log('🔍 ProyectoDetalle - Cantidad de tareas:', tasks.length);
        
        // Ordenar tareas por prioridad y dificultad
        this.projectTasks = ValidationService.sortTasksByPriority(tasks);
        console.log('🔍 ProyectoDetalle - Tareas ordenadas por prioridad y dificultad');
      } catch (error) {
        console.error('Error cargando tareas:', error);
        this.projectTasks = [];
      }
    },
    
    async createTask() {
      try {
        // Validaciones básicas
        if (!this.newTask.descripcion.trim()) {
          throw new Error('La descripción es obligatoria');
        }
        if (!this.newTask.nivelDificultad) {
          throw new Error('Debe seleccionar un nivel de dificultad');
        }
        if (!this.newTask.prioridad) {
          throw new Error('Debe seleccionar una prioridad');
        }
        if (!this.newTask.habilidadesRequeridas || this.newTask.habilidadesRequeridas.length === 0) {
          throw new Error('Debe agregar al menos una habilidad requerida');
        }

        // Validación de horas para tareas del mismo día
        if (this.newTask.fechaEstimadaInicio && this.newTask.fechaEstimadaFin && this.newTask.tiempoEstimadoHoras) {
          const sameDayValidation = ValidationService.validateSameDayHours({
            fechaEstimadaInicio: this.newTask.fechaEstimadaInicio,
            fechaEstimadaFin: this.newTask.fechaEstimadaFin,
            tiempoEstimadoHoras: this.newTask.tiempoEstimadoHoras
          });
          
          if (!sameDayValidation.isValid) {
            throw new Error(sameDayValidation.message);
          }
        }

        // Validación de disponibilidad del desarrollador si está asignado
        if (this.newTask.desarrolladorAsignado && this.newTask.fechaEstimadaInicio && this.newTask.fechaEstimadaFin && this.newTask.tiempoEstimadoHoras) {
          const developerId = typeof this.newTask.desarrolladorAsignado === 'object' 
            ? this.newTask.desarrolladorAsignado._id 
            : this.newTask.desarrolladorAsignado;

          const availabilityValidation = await ValidationService.validateDeveloperAvailability(
            developerId,
            this.newTask.fechaEstimadaInicio,
            this.newTask.fechaEstimadaFin,
            this.newTask.tiempoEstimadoHoras
          );

          if (!availabilityValidation.isValid) {
            throw new Error(availabilityValidation.message);
          }

          // Validar habilidades del desarrollador
          const selectedDeveloper = this.users.find(u => u._id === developerId);
          if (selectedDeveloper) {
            const skillsValidation = ValidationService.validateSkillsMatch(
              selectedDeveloper.habilidades || [],
              this.newTask.habilidadesRequeridas || []
            );

            if (!skillsValidation.isValid) {
              throw new Error(`El desarrollador no cumple con los requisitos de habilidades: ${skillsValidation.message}`);
            }
          }
        }

        const projectId = this.$route.params.id;
        const taskData = {
          descripcion: this.newTask.descripcion,
          prioridad: this.newTask.prioridad,
          nivelDificultad: parseInt(this.newTask.nivelDificultad),
          estado: this.newTask.estado,
          desarrolladorAsignado: this.newTask.desarrolladorAsignado || null,
          tiempoEstimadoHoras: this.newTask.tiempoEstimadoHoras,
          tiempoInvertidoHoras: this.newTask.tiempoInvertidoHoras || 0,
          fechaEstimadaInicio: this.newTask.fechaEstimadaInicio || null,
          fechaEstimadaFin: this.newTask.fechaEstimadaFin || null,
          habilidadesRequeridas: this.newTask.habilidadesRequeridas || [],
          proyecto: projectId
        };
        
        if (this.isEditing) {
          // Actualizar tarea existente - NO incluir el campo proyecto
          const updateData = {
            descripcion: this.newTask.descripcion,
            prioridad: this.newTask.prioridad,
            nivelDificultad: parseInt(this.newTask.nivelDificultad),
            estado: this.newTask.estado,
            desarrolladorAsignado: this.newTask.desarrolladorAsignado || null,
            tiempoEstimadoHoras: this.newTask.tiempoEstimadoHoras,
            tiempoInvertidoHoras: this.newTask.tiempoInvertidoHoras || 0,
            fechaEstimadaInicio: this.newTask.fechaEstimadaInicio || null,
            fechaEstimadaFin: this.newTask.fechaEstimadaFin || null,
            habilidadesRequeridas: this.newTask.habilidadesRequeridas || []
          };
          console.log('ProyectoDetalle - Actualizando tarea:', this.newTask._id, updateData);
          await TaskService.updateTask(this.newTask._id, updateData);
        } else {
          // Crear nueva tarea
          console.log('ProyectoDetalle - Creando tarea para proyecto:', projectId);
          await TaskService.createTask(projectId, taskData);
        }
        
        this.showAddTaskModal = false;
        this.isEditing = false;
        this.resetTaskForm();
        await this.loadProjectTasks();
      } catch (error) {
        console.error('Error guardando tarea:', error);
        alert('Error al guardar la tarea: ' + (error.response?.data?.error || error.message));
      }
    },

    // Resetear formulario de tarea
    resetTaskForm() {
      this.newTask = {
        descripcion: '',
        prioridad: 'media',
        nivelDificultad: '',
        estado: 'pendiente',
        desarrolladorAsignado: '',
        tiempoEstimadoHoras: null,
        tiempoInvertidoHoras: 0,
        fechaEstimadaInicio: '',
        fechaEstimadaFin: '',
        fechaRealInicio: '',
        fechaRealFin: '',
        habilidadesRequeridas: [],
        proyecto: this.$route.params.id,
        _id: null
      };
      this.skillInput = '';
    },
    
    // Ver detalles de tarea
    viewTask(task) {
      alert(`Detalles de la tarea:\n\nDescripción: ${task.descripcion}\nPrioridad: ${task.prioridad}\nEstado: ${task.estado}\nDesarrollador: ${task.desarrolladorAsignado ? this.getDeveloperName(task.desarrolladorAsignado) : 'Sin asignar'}`);
    },
    
    // Editar tarea
    editTask(task) {
      // Pre-poblar el formulario con los datos de la tarea
      this.newTask = {
        descripcion: task.descripcion,
        prioridad: task.prioridad,
        nivelDificultad: task.nivelDificultad?.toString() || '',
        estado: task.estado || 'pendiente',
        desarrolladorAsignado: task.desarrolladorAsignado?._id || task.desarrolladorAsignado || '',
        tiempoEstimadoHoras: task.tiempoEstimadoHoras || null,
        tiempoInvertidoHoras: task.tiempoInvertidoHoras || 0,
        fechaEstimadaInicio: task.fechaEstimadaInicio ? this.formatDateForInput(task.fechaEstimadaInicio) : '',
        fechaEstimadaFin: task.fechaEstimadaFin ? this.formatDateForInput(task.fechaEstimadaFin) : '',
        fechaRealInicio: task.fechaRealInicio ? this.formatDateForInput(task.fechaRealInicio) : '',
        fechaRealFin: task.fechaRealFin ? this.formatDateForInput(task.fechaRealFin) : '',
        habilidadesRequeridas: task.habilidadesRequeridas ? [...task.habilidadesRequeridas] : [],
        proyecto: this.$route.params.id,
        _id: task._id // Guardar el ID para la actualización
      };
      this.isEditing = true;
      this.showAddTaskModal = true;
    },
    
    // Eliminar tarea
    async deleteTask(task) {
      if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        try {
          await TaskService.deleteTask(task._id);
          await this.loadProjectTasks();
        } catch (error) {
          console.error('Error eliminando tarea:', error);
          alert('Error al eliminar la tarea: ' + (error.response?.data?.error || error.message));
        }
      }
    },
    
    // Cargar habilidades
    async loadSkills() {
      try {
        const response = await SkillsService.getSkills();
        this.availableSkills = response.data || [];
        console.log('🔍 ProyectoDetalle - Habilidades cargadas:', this.availableSkills);
      } catch (error) {
        console.error('Error cargando habilidades:', error);
        this.availableSkills = [];
      }
    },

    async loadUsers() {
      try {
        const response = await UserService.getUsers();
        this.users = response.data || [];
        console.log('🔍 ProyectoDetalle - Usuarios cargados:', this.users);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        this.users = [];
      }
    },
    
    // Agregar habilidad
    addSkill() {
      const skill = this.skillInput.trim();
      if (skill && !this.newTask.habilidadesRequeridas.includes(skill)) {
        this.newTask.habilidadesRequeridas.push(skill);
        this.skillInput = '';
      }
    },
    
    // Agregar habilidad desde la lista disponible
    addSkillFromList(skill) {
      if (!this.newTask.habilidadesRequeridas.includes(skill)) {
        this.newTask.habilidadesRequeridas.push(skill);
      }
    },
    
    // Remover habilidad
    removeSkill(index) {
      this.newTask.habilidadesRequeridas.splice(index, 1);
    },
    
    // Cerrar modal y resetear formulario
    closeModal() {
      this.showAddTaskModal = false;
      this.isEditing = false;
      this.resetTaskForm();
    },
    
    formatDateForInput(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },
    
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
    
    getDeveloperName(developer) {
      // Si no hay desarrollador asignado
      if (!developer) {
        return 'Sin asignar';
      }
      
      // Si el desarrollador es un objeto populado (viene del backend)
      if (typeof developer === 'object' && developer._id) {
        return developer.nombre || developer.email || 'Desarrollador';
      }
      
      // Si es solo un ID (string)
      return developer || 'Sin asignar';
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

.tasks-table-container {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tasks-table {
  margin: 0;
  font-size: 0.9rem;
}

.tasks-table th {
  background-color: #343a40 !important;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  padding: 1rem 0.75rem;
  border: none;
}

.tasks-table td {
  padding: 1rem 0.75rem;
  vertical-align: middle;
  border-top: 1px solid #dee2e6;
}

.tasks-table tbody tr:hover {
  background-color: #f8f9fa;
}

.task-description {
  max-width: 200px;
  word-wrap: break-word;
  line-height: 1.4;
}

.task-assignee {
  color: #007bff;
  font-weight: 600;
  font-size: 0.85rem;
}

.task-deadline {
  color: #6c757d;
  font-size: 0.85rem;
  white-space: nowrap;
}

.difficulty-badge {
  background-color: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.skills-badge {
  background-color: #f8f9fa;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  max-width: 150px;
  display: inline-block;
  word-wrap: break-word;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.task-actions .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 0.25rem;
}

/* Badges para estado y prioridad */
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
}

.status-completed {
  background-color: #d4edda !important;
  color: #155724 !important;
}

.status-in-progress {
  background-color: #fff3cd !important;
  color: #856404 !important;
}

.status-pending {
  background-color: #e2e3e5 !important;
  color: #495057 !important;
}

.priority-high {
  background-color: #f8d7da !important;
  color: #721c24 !important;
}

.priority-medium {
  background-color: #fff3cd !important;
  color: #856404 !important;
}

.priority-low {
  background-color: #d4edda !important;
  color: #155724 !important;
}

/* Tab Equipo */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.team-info {
  text-align: right;
  max-width: 300px;
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

.member-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.tasks-count {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  width: fit-content;
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
