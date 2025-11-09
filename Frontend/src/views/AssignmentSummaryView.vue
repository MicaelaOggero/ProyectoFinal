<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>
        <i class="bi bi-clipboard-data me-2"></i>
        Resumen de Asignación Automática
      </h1>
      <button class="btn btn-outline-secondary" @click="goBack">
        <i class="bi bi-arrow-left me-1"></i>
        Volver
      </button>
    </div>

    <!-- Información del Resumen -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Información del Resumen
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Fecha de Generación:</strong> {{ formatDate(summaryData?.fechaGeneracion) }}</p>
                <p><strong>Proyecto:</strong> {{ selectedProjectName }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Total de Tareas:</strong> {{ filteredAssignments.length }}</p>
                <p><strong>Tareas Asignadas:</strong> {{ filteredAssignedTasksCount }}</p>
                <p v-if="summaryData?.tipo">
                  <strong>Tipo de Asignación:</strong> 
                  <span class="badge" :class="getAssignmentTypeClass(summaryData.tipo)">
                    <i class="bi" :class="getAssignmentTypeIcon(summaryData.tipo)"></i>
                    {{ getAssignmentTypeText(summaryData.tipo) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen de Asignaciones -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-list-check me-2"></i>
              Detalle de Asignaciones
            </h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            
        <div v-else-if="!summaryData?.resumen || summaryData.resumen.length === 0" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-1"></i>
          <p class="mt-2">No hay asignaciones disponibles</p>
          <p class="small">
            No se encontraron asignaciones en ninguno de los proyectos.
            <br>
            <strong>Total de proyectos revisados:</strong> {{ projects.length }}
            <br>
            <strong>Asignaciones encontradas:</strong> {{ allAssignments.length }}
          </p>
          <button class="btn btn-sm btn-outline-primary mt-2" @click="loadSummaryData">
            <i class="bi bi-arrow-clockwise me-1"></i>Recargar
          </button>
        </div>

            <div v-else>
              <!-- Filtros -->
              <div class="row mb-3">
                <div class="col-md-12">
                  <label for="projectFilter" class="form-label">
                    <i class="bi bi-folder me-1"></i>
                    Filtrar por Proyecto
                  </label>
                  <select class="form-select" id="projectFilter" v-model="projectFilter">
                    <option value="">Todos los proyectos</option>
                    <option v-for="project in uniqueProjects" :key="project.id" :value="project.id">
                      {{ project.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Lista de Asignaciones -->
              <div class="assignment-list">
                <div 
                  v-for="(assignment, index) in filteredAssignments" 
                  :key="index" 
                  class="assignment-item"
                  :class="{ 'assignment-success': assignment.asignado, 'assignment-warning': !assignment.asignado }"
                >
                  <div class="assignment-header">
                    <div class="assignment-info">
                      <h6 class="assignment-title">{{ assignment.tarea?.descripcion || assignment.tarea }}</h6>
                      <div class="assignment-meta">
                        <span v-if="assignment.asignado" class="badge bg-success">
                          <i class="bi bi-person-check me-1"></i>
                          Asignada a: {{ assignment.asignado }}
                        </span>
                        <span v-else class="badge bg-warning text-dark">
                          <i class="bi bi-exclamation-triangle me-1"></i>
                          Sin asignar
                        </span>
                        <span v-if="assignment.tarea?.estado" class="badge bg-info">
                          <i class="bi bi-tag me-1"></i>
                          {{ assignment.tarea.estado }}
                        </span>
                        <span v-if="assignment.proyecto" class="badge bg-secondary">
                          <i class="bi bi-folder me-1"></i>
                          {{ assignment.proyecto }}
                        </span>
                        <span v-if="assignment.criterio || assignment.tipoAsignacion" class="badge" :class="getAssignmentTypeClass(resolveAssignmentType(assignment))">
                          <i class="bi" :class="getAssignmentTypeIcon(resolveAssignmentType(assignment))"></i>
                          {{ getAssignmentTypeText(resolveAssignmentType(assignment)) }}
                        </span>
                      </div>
                    </div>
                    <div class="assignment-actions">
                      <div class="assignment-status me-3">
                        <i v-if="assignment.asignado" class="bi bi-check-circle-fill text-success fs-4"></i>
                        <i v-else class="bi bi-x-circle-fill text-warning fs-4"></i>
                      </div>
                      <!-- Botón de editar asignación (solo para tareas asignadas) -->
                      <button 
                        v-if="assignment.asignado && assignment.asignacionId"
                        class="btn btn-sm btn-outline-primary"
                        @click="editAssignment(assignment)"
                        title="Editar Asignación"
                      >
                        <i class="bi bi-person-gear"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Información adicional para tareas asignadas -->
                  <div v-if="assignment.asignado" class="assignment-details">
                    <div class="row">
                      <div class="col-md-6">
                        <p v-if="assignment.tarea?.tiempoEstimadoHoras" class="mb-1">
                          <i class="bi bi-clock me-1"></i>
                          <strong>Horas Estimadas:</strong> {{ assignment.tarea.tiempoEstimadoHoras }}h
                        </p>
                        <p v-if="assignment.horasAsignadasTotales" class="mb-1">
                          <i class="bi bi-clock-fill me-1"></i>
                          <strong>Horas Asignadas:</strong> {{ assignment.horasAsignadasTotales }}h
                        </p>
                        <p v-if="assignment.dias && assignment.dias.length > 0" class="mb-1">
                          <i class="bi bi-calendar me-1"></i>
                          <strong>Días Asignados:</strong> {{ assignment.dias.length }} días
                        </p>
                        <p v-if="assignment.tarea?.fechaEstimadaInicio" class="mb-1">
                          <i class="bi bi-calendar-event me-1"></i>
                          <strong>Fecha Inicio:</strong> {{ formatDate(assignment.tarea.fechaEstimadaInicio) }}
                        </p>
                        <p v-if="assignment.tarea?.fechaEstimadaFin" class="mb-1">
                          <i class="bi bi-calendar-check me-1"></i>
                          <strong>Fecha Fin:</strong> {{ formatDate(assignment.tarea.fechaEstimadaFin) }}
                        </p>
                        <p v-if="getAssignmentCost(assignment) > 0" class="mb-1">
                          <i class="bi bi-currency-dollar me-1"></i>
                          <strong>Costo Total:</strong> {{ formatCurrency(getAssignmentCost(assignment)) }}
                        </p>
                        <p v-if="getAssignmentCostPerHour(assignment) > 0" class="mb-1">
                          <i class="bi bi-currency-exchange me-1"></i>
                          <strong>Costo por Hora:</strong> {{ formatCurrency(getAssignmentCostPerHour(assignment)) }}
                        </p>
                        <p v-if="assignment.razon" class="mb-1 text-muted">
                          <i class="bi bi-chat-left-quote me-1 text-primary"></i>
                          <strong>Razón:</strong> {{ assignment.razon }}
                        </p>
                      </div>
                      <div class="col-md-6">
                        <div v-if="assignment.desarrollador?.habilidades && assignment.desarrollador.habilidades.length > 0" class="mb-2">
                          <small class="text-muted">Habilidades del desarrollador:</small>
                          <div class="skills-list">
                            <span 
                              v-for="(habilidad, index) in assignment.desarrollador.habilidades.slice(0, 3)" 
                              :key="index"
                              class="skill-badge"
                            >
                              {{ typeof habilidad === 'string' ? habilidad : habilidad.nombre }}
                            </span>
                            <span v-if="assignment.desarrollador.habilidades.length > 3" class="skill-badge more-skills">
                              +{{ assignment.desarrollador.habilidades.length - 3 }} más
                            </span>
                          </div>
                        </div>
                        <div v-if="assignment.dias && assignment.dias.length > 0" class="days-list">
                          <small class="text-muted">Fechas asignadas:</small>
                          <div class="days-grid">
                            <span 
                              v-for="(dia, diaIndex) in assignment.dias.slice(0, 3)" 
                              :key="diaIndex"
                              class="day-badge"
                              :title="`${formatDate(dia.fecha)} - ${dia.horasAsignadas}h`"
                            >
                              {{ formatDate(dia.fecha) }} ({{ dia.horasAsignadas }}h)
                            </span>
                            <span v-if="assignment.dias.length > 3" class="day-badge more-days">
                              +{{ assignment.dias.length - 3 }} más
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Motivo para tareas sin asignar -->
                  <div v-else-if="assignment.motivo" class="assignment-details">
                    <div class="alert alert-warning mb-0">
                      <i class="bi bi-info-circle me-1"></i>
                      <strong>Motivo:</strong> {{ assignment.motivo }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas Resumen -->
    <div v-if="summaryData?.resumen && summaryData.resumen.length > 0" class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header bg-light">
            <h5 class="mb-0">
              <i class="bi bi-bar-chart me-2"></i>
              Estadísticas
            </h5>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-md-2">
                <div class="stat-item">
                  <h3 class="text-primary">{{ filteredAssignedTasksCount }}</h3>
                  <p class="text-muted">Tareas Asignadas</p>
                </div>
              </div>
              <div class="col-md-2">
                <div class="stat-item">
                  <h3 class="text-warning">{{ filteredUnassignedTasksCount }}</h3>
                  <p class="text-muted">Sin Asignar</p>
                </div>
              </div>
              <div class="col-md-2">
                <div class="stat-item">
                  <h3 class="text-info">{{ filteredUniqueDevelopers.length }}</h3>
                  <p class="text-muted">Desarrolladores</p>
                </div>
              </div>
              <div class="col-md-2">
                <div class="stat-item">
                  <h3 class="text-success">{{ filteredTotalHoursAssigned }}</h3>
                  <p class="text-muted">Horas Totales</p>
                </div>
              </div>
              <div class="col-md-2">
                <div class="stat-item">
                  <h3 class="text-danger">${{ formatCurrency(filteredTotalCost) }}</h3>
                  <p class="text-muted">Costo Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Editar Asignación -->
    <div class="modal fade" id="editAssignmentModal" tabindex="-1" aria-labelledby="editAssignmentModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editAssignmentModalLabel">Editar Asignación</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedAssignmentForEdit">
            <div class="mb-3">
              <label class="form-label"><strong>Tarea:</strong></label>
              <p class="form-control-plaintext">{{ selectedAssignmentForEdit.tarea?.descripcion || selectedAssignmentForEdit.tarea }}</p>
            </div>
            
            <div class="mb-3">
              <label class="form-label"><strong>Desarrollador Actual:</strong></label>
              <p class="form-control-plaintext">{{ selectedAssignmentForEdit.asignado }}</p>
            </div>
            
            <div class="mb-3">
              <label for="newDeveloperSelect" class="form-label">Nuevo Desarrollador:</label>
              <select 
                class="form-select" 
                id="newDeveloperSelect" 
                v-model="assignmentForm.newDeveloperId"
                :disabled="isUpdatingAssignment"
              >
                <option value="">Seleccionar desarrollador...</option>
                <option 
                  v-for="user in availableUsers" 
                  :key="user._id" 
                  :value="user._id"
                  :disabled="user._id === selectedAssignmentForEdit.desarrollador?.id"
                >
                  {{ user.nombre }} {{ user.apellido }}
                  <span v-if="user._id === selectedAssignmentForEdit.desarrollador?.id">(Actual)</span>
                </option>
              </select>
            </div>
            
            <div v-if="selectedNewDeveloper" class="mb-3">
              <h6>Información del Nuevo Desarrollador:</h6>
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Experiencia:</strong> {{ selectedNewDeveloper.aniosExperiencia }} años</p>
                  <p><strong>Horas Semanales:</strong> {{ selectedNewDeveloper.horasSemanalMaxima }}h</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Habilidades:</strong></p>
                  <div class="skills-preview">
                    <span 
                      v-for="(habilidad, index) in selectedNewDeveloper.habilidades?.slice(0, 3)" 
                      :key="index"
                      class="badge bg-light text-dark me-1 mb-1"
                    >
                      {{ typeof habilidad === 'string' ? habilidad : habilidad.nombre }}
                    </span>
                    <span v-if="selectedNewDeveloper.habilidades?.length > 3" class="badge bg-secondary">
                      +{{ selectedNewDeveloper.habilidades.length - 3 }} más
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" :disabled="isUpdatingAssignment">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateAssignment"
              :disabled="!assignmentForm.newDeveloperId || isUpdatingAssignment"
            >
              <span v-if="isUpdatingAssignment" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ isUpdatingAssignment ? 'Actualizando...' : 'Actualizar Asignación' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AssignmentService from '@/services/assignment.service.js';
import ProjectService from '@/services/project.service.js';
import UserService from '@/services/user.service.js';
import { Modal } from 'bootstrap';

export default {
  name: 'AssignmentSummaryView',
  data() {
    return {
      summaryData: null,
      loading: false,
      projectFilter: '',
      projects: [],
      allAssignments: [],
      
      // Para edición de asignaciones
      selectedAssignmentForEdit: null,
      assignmentForm: {
        newDeveloperId: ''
      },
      isUpdatingAssignment: false,
      users: [],
      editAssignmentModalInstance: null
    };
  },
  computed: {
    filteredAssignments() {
      if (!this.summaryData?.resumen) return [];
      
      let filtered = this.summaryData.resumen;
      
      // Filtrar por proyecto
      if (this.projectFilter) {
        console.log('🔍 Filtrando por proyecto:', this.projectFilter);
        filtered = filtered.filter(a => a.proyectoId === this.projectFilter);
        console.log('🔍 Asignaciones filtradas:', filtered.length);
      }
      
      return filtered;
    },
    
    uniqueProjects() {
      if (!this.summaryData?.resumen) return [];
      
      const projectsMap = new Map();
      
      this.summaryData.resumen.forEach(a => {
        if (a.proyecto && a.proyectoId) {
          projectsMap.set(a.proyectoId, a.proyecto);
        }
      });
      
      const projects = Array.from(projectsMap, ([id, name]) => ({ id, name }));
      console.log('🔍 Proyectos únicos encontrados:', projects);
      return projects;
    },
    
    selectedProjectName() {
      if (!this.projectFilter) return 'Todos los proyectos';
      
      const project = this.uniqueProjects.find(p => p.id === this.projectFilter);
      return project ? project.name : 'Todos los proyectos';
    },
    
    filteredAssignedTasksCount() {
      return this.filteredAssignments.filter(a => a.asignado).length;
    },
    
    filteredUnassignedTasksCount() {
      return this.filteredAssignments.filter(a => !a.asignado).length;
    },
    
    filteredUniqueDevelopers() {
      const developers = this.filteredAssignments
        .filter(a => a.asignado)
        .map(a => a.asignado);
      return [...new Set(developers)];
    },
    
    // Para edición de asignaciones
    availableUsers() {
      const filtered = this.users.filter(user => user.rol === 'user');
      console.log('🔍 Usuarios disponibles para asignación:', filtered);
      return filtered;
    },
    
    selectedNewDeveloper() {
      if (!this.assignmentForm.newDeveloperId) return null;
      return this.users.find(user => user._id === this.assignmentForm.newDeveloperId);
    },
    
    filteredTotalHoursAssigned() {
      return this.filteredAssignments
        .filter(a => a.horasAsignadasTotales)
        .reduce((total, a) => total + a.horasAsignadasTotales, 0);
    },
    
    assignedTasksCount() {
      if (!this.summaryData?.resumen) return 0;
      return this.summaryData.resumen.filter(a => a.asignado).length;
    },
    
    unassignedTasksCount() {
      if (!this.summaryData?.resumen) return 0;
      return this.summaryData.resumen.filter(a => !a.asignado).length;
    },
    
    uniqueDevelopers() {
      if (!this.summaryData?.resumen) return [];
      const developers = this.summaryData.resumen
        .filter(a => a.asignado)
        .map(a => a.asignado);
      return [...new Set(developers)];
    },
    
    totalHoursAssigned() {
      if (!this.summaryData?.resumen) return 0;
      return this.summaryData.resumen
        .filter(a => a.horasAsignadasTotales)
        .reduce((total, a) => total + a.horasAsignadasTotales, 0);
    },
    
    filteredTotalCost() {
      return this.filteredAssignments
        .filter(a => a.asignado) // Solo asignaciones que tienen desarrollador asignado
        .reduce((total, a) => {
          // Si ya tiene costoTotal calculado (asignación por costo), usarlo
          if (a.costoTotal && a.costoTotal > 0) {
            return total + a.costoTotal;
          }
          
          // Si no tiene costoTotal pero tiene costoPorHora del desarrollador y horas, calcularlo
          const costoPorHora = a.costoPorHora || a.desarrollador?.costoPorHora || 0;
          if (costoPorHora > 0 && a.horasAsignadasTotales && a.horasAsignadasTotales > 0) {
            return total + (costoPorHora * a.horasAsignadasTotales);
          }
          
          // Si no tiene información de costo, no agregar nada
          return total;
        }, 0);
    }
  },
  async mounted() {
    await this.loadSummaryData();
    await this.loadUsers();
    // Inicializar modales después de que el DOM esté completamente renderizado
    this.$nextTick(() => {
      this.initializeModals();
    });
  },
  methods: {
    async loadSummaryData(forceRefresh = false) {
      this.loading = true;
      try {
        // Si no es un refresh forzado, intentar cargar desde localStorage primero
        if (!forceRefresh) {
          const savedData = localStorage.getItem('lastAssignmentData');
          if (savedData) {
            this.summaryData = JSON.parse(savedData);
            console.log('Datos de asignación cargados desde localStorage:', this.summaryData);
          } else {
            console.log('No hay datos de asignación guardados en localStorage');
          }
        }

        // Siempre cargar asignaciones desde el backend para obtener datos actualizados
        await this.loadAssignmentsFromBackend();
        
        console.log('🔍 Datos del resumen después de la actualización:', this.summaryData);
        
      } catch (error) {
        console.error('Error cargando datos de asignación:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadAssignmentsFromBackend() {
      try {
        // Cargar proyectos primero
        const projectsResponse = await ProjectService.getProjects();
        this.projects = projectsResponse.data;
        console.log('Proyectos cargados:', this.projects);

        // Cargar asignaciones de cada proyecto
        this.allAssignments = [];
        for (const project of this.projects) {
          try {
            const assignmentsResponse = await AssignmentService.getAssignmentsByProject(project._id);
            console.log(`Respuesta para proyecto ${project.name}:`, assignmentsResponse);
            
            if (assignmentsResponse.asignaciones && assignmentsResponse.asignaciones.length > 0) {
              // Agregar información del proyecto a cada asignación
              const assignmentsWithProject = assignmentsResponse.asignaciones.map(assignment => ({
                ...assignment,
                projectName: project.name || project.nombre,
                proyectoId: project._id
              }));
              this.allAssignments.push(...assignmentsWithProject);
              console.log(`✅ Asignaciones cargadas para proyecto ${project.name}:`, assignmentsWithProject);
            } else {
              console.log(`ℹ️ No hay asignaciones para el proyecto ${project.name}`);
            }
        } catch (error) {
            // Si es un error 400, significa que no hay asignaciones para este proyecto
            if (error.response && error.response.status === 400) {
              console.log(`ℹ️ Proyecto ${project.name} no tiene asignaciones (error 400 esperado)`);
            } else {
              console.error(`❌ Error inesperado cargando asignaciones del proyecto ${project.name}:`, error);
            }
            // Continuar con el siguiente proyecto aunque uno falle
          }
        }

        // Si no hay datos en localStorage pero sí hay asignaciones en el backend, crear el resumen
        if (!this.summaryData && this.allAssignments.length > 0) {
          this.summaryData = {
            message: "Asignaciones cargadas desde la base de datos",
                resumen: this.allAssignments.map(assignment => ({
                  // ID de la asignación
                  asignacionId: assignment.asignacionId,
                  
                  // Información completa de la tarea
                  tarea: {
                    id: assignment.tarea?.id,
                    descripcion: assignment.tarea?.descripcion || 'Tarea no disponible',
                    fechaEstimadaInicio: assignment.tarea?.fechaEstimadaInicio,
                    fechaEstimadaFin: assignment.tarea?.fechaEstimadaFin,
                    tiempoEstimadoHoras: assignment.tarea?.tiempoEstimadoHoras,
                    estado: assignment.tarea?.estado
                  },
                  
                  // Información completa del desarrollador
                  desarrollador: {
                    id: assignment.desarrollador?.id,
                    nombre: assignment.desarrollador?.nombre || 'Desarrollador no disponible',
                    habilidades: assignment.desarrollador?.habilidades || [],
                    costoPorHora: assignment.desarrollador?.costoPorHora || 0
                  },
                  
                  // Nombre del desarrollador para compatibilidad
                  asignado: assignment.desarrollador?.nombre || 'Desarrollador no disponible',
                  
                  // Información del proyecto
                  proyecto: assignment.projectName,
                  proyectoId: assignment.proyectoId,
                  
                  // Información de días y horas
                  horasAsignadasTotales: assignment.horasTotales || 0,
                  dias: assignment.dias || [],
                  
                  // Información de costo
                  costoTotal: assignment.costoTotal || 0,
                  costoPorHora: assignment.costoPorHora || 0,
                  
                  // Tipo de asignación (basica o costo)
                  tipoAsignacion: assignment.tipoAsignacion || 'basica',
                  
                  // Fecha de asignación
                  fechaAsignacion: assignment.creadoEn || new Date().toISOString()
                })),
            fechaGeneracion: new Date().toISOString(),
            proyecto: { nombre: 'Todos los proyectos' }
          };
          console.log('Resumen creado desde asignaciones del backend:', this.summaryData);
        }

      } catch (error) {
        console.error('Error cargando asignaciones desde el backend:', error);
      }
    },
    
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Usar métodos UTC para evitar cambios por zona horaria
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    },
    
    formatCurrency(amount) {
      if (!amount || amount === 0) return '0';
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },
    
    getAssignmentCost(assignment) {
      // Si ya tiene costoTotal calculado (asignación por costo), usarlo
      if (assignment.costoTotal && assignment.costoTotal > 0) {
        return assignment.costoTotal;
      }
      
      // Si no tiene costoTotal pero tiene costoPorHora y horas, calcularlo
      const costoPorHora = assignment.costoPorHora || assignment.desarrollador?.costoPorHora || 0;
      if (costoPorHora > 0 && assignment.horasAsignadasTotales && assignment.horasAsignadasTotales > 0) {
        return costoPorHora * assignment.horasAsignadasTotales;
      }
      
      return 0;
    },
    
    getAssignmentCostPerHour(assignment) {
      // Priorizar costoPorHora de la asignación, luego del desarrollador
      return assignment.costoPorHora || assignment.desarrollador?.costoPorHora || 0;
    },
    
    resolveAssignmentType(assignment) {
      return assignment?.criterio || assignment?.tipoAsignacion || this.summaryData?.tipo || 'basica';
    },
    
    goBack() {
      this.$router.go(-1);
    },
    
    getAssignmentTypeClass(tipo) {
      const map = {
        costo: 'bg-success',
        basica: 'bg-primary',
        availability: 'bg-primary',
        time: 'bg-warning text-dark',
        tiempo: 'bg-warning text-dark',
        quality: 'bg-info text-dark',
        calidad: 'bg-info text-dark'
      };
      return map[tipo] || 'bg-secondary';
    },
    
    getAssignmentTypeIcon(tipo) {
      const map = {
        costo: 'bi-currency-dollar me-1',
        basica: 'bi-clock-history me-1',
        availability: 'bi-clock-history me-1',
        time: 'bi-hourglass-split me-1',
        tiempo: 'bi-hourglass-split me-1',
        quality: 'bi-star-fill me-1',
        calidad: 'bi-star-fill me-1'
      };
      return map[tipo] || 'bi-sliders me-1';
    },
    
    getAssignmentTypeText(tipo) {
      const map = {
        costo: 'Por Costo',
        basica: 'Disponibilidad y Habilidades',
        availability: 'Disponibilidad y Habilidades',
        time: 'Por Tiempo (IA)',
        tiempo: 'Por Tiempo (IA)',
        quality: 'Por Calidad (IA)',
        calidad: 'Por Calidad (IA)'
      };
      return map[tipo] || 'Asignación';
    },
    
    // Métodos para edición de asignaciones
    async loadUsers() {
      try {
        const response = await UserService.getUsers();
        this.users = response.data;
        console.log('🔍 Usuarios cargados:', this.users);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      }
    },
    
    initializeModals() {
      const modalElement = document.getElementById('editAssignmentModal');
      if (modalElement) {
        this.editAssignmentModalInstance = new Modal(modalElement);
      } else {
        console.warn('Modal element not found, retrying...');
        // Reintentar después de un breve delay
        setTimeout(() => {
          const retryElement = document.getElementById('editAssignmentModal');
          if (retryElement) {
            this.editAssignmentModalInstance = new Modal(retryElement);
          }
        }, 100);
      }
    },
    
    editAssignment(assignment) {
      this.selectedAssignmentForEdit = assignment;
      this.assignmentForm.newDeveloperId = '';
      
      // Asegurar que el modal esté inicializado
      if (!this.editAssignmentModalInstance) {
        this.initializeModals();
      }
      
      if (this.editAssignmentModalInstance) {
        this.editAssignmentModalInstance.show();
      } else {
        console.error('No se pudo inicializar el modal de edición');
        alert('Error al abrir el modal de edición. Por favor, recarga la página.');
      }
    },
    
    closeEditAssignmentModal() {
      if (this.editAssignmentModalInstance) {
        this.editAssignmentModalInstance.hide();
      }
      this.selectedAssignmentForEdit = null;
      this.assignmentForm.newDeveloperId = '';
      this.isUpdatingAssignment = false;
    },
    
    async updateAssignment() {
      if (!this.selectedAssignmentForEdit || !this.assignmentForm.newDeveloperId) {
        alert('Por favor selecciona un nuevo desarrollador');
        return;
      }
      
      try {
        this.isUpdatingAssignment = true;
        
        console.log('🔍 EditAssignment - Asignación:', this.selectedAssignmentForEdit);
        console.log('🔍 EditAssignment - Nuevo desarrollador ID:', this.assignmentForm.newDeveloperId);
        
        // Validar que no sea el mismo desarrollador
        if (this.assignmentForm.newDeveloperId === this.selectedAssignmentForEdit.desarrollador?.id) {
          alert('El nuevo desarrollador debe ser diferente al actual');
          return;
        }
        
        // Llamar al servicio de asignaciones
        const response = await AssignmentService.editAssignment(
          this.selectedAssignmentForEdit.asignacionId, 
          this.assignmentForm.newDeveloperId
        );
        
        console.log('🔍 Respuesta del backend:', response);
        
        // Buscar el nuevo desarrollador en la lista de usuarios
        const newDeveloper = this.users.find(u => u._id === this.assignmentForm.newDeveloperId);
        
        if (newDeveloper && this.summaryData?.resumen) {
          // Actualizar la asignación en el resumen local
          const assignmentIndex = this.summaryData.resumen.findIndex(
            a => a.asignacionId === this.selectedAssignmentForEdit.asignacionId
          );
          
          if (assignmentIndex !== -1) {
            // Actualizar la asignación con el nuevo desarrollador
            this.summaryData.resumen[assignmentIndex].desarrollador = {
              id: newDeveloper._id,
              nombre: newDeveloper.nombre,
              habilidades: newDeveloper.habilidades || [],
              costoPorHora: newDeveloper.costoPorHora || 0
            };
            this.summaryData.resumen[assignmentIndex].asignado = newDeveloper.nombre;
            
            console.log('🔍 Asignación actualizada en el resumen:', this.summaryData.resumen[assignmentIndex]);
          }
        }
        
        // Cerrar el modal
        this.closeEditAssignmentModal();
        
        alert('Asignación actualizada correctamente.\n\nLos calendarios de disponibilidad de ambos desarrolladores han sido actualizados automáticamente.');
        
      } catch (error) {
        console.error('Error actualizando asignación:', error);
        alert('Error al actualizar la asignación: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isUpdatingAssignment = false;
      }
    }
  }
};
</script>

<style scoped>
.assignment-item {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.assignment-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.assignment-success {
  border-left: 4px solid #28a745;
  background: linear-gradient(90deg, rgba(40, 167, 69, 0.05) 0%, transparent 100%);
}

.assignment-warning {
  border-left: 4px solid #ffc107;
  background: linear-gradient(90deg, rgba(255, 193, 7, 0.05) 0%, transparent 100%);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.assignment-title {
  color: #495057;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.assignment-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.assignment-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.days-list {
  margin-top: 0.5rem;
}

.days-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.day-badge {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.day-badge.more-days {
  background: #007bff;
  color: white;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.skill-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #bbdefb;
}

.skill-badge.more-skills {
  background: #1976d2;
  color: white;
  border: 1px solid #1976d2;
}

.stat-item h3 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-item p {
  font-size: 0.9rem;
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .assignment-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .assignment-status {
    align-self: flex-start;
  }
  
  .days-grid {
    justify-content: flex-start;
  }
}

/* Animaciones */
.assignment-item {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estilos para badges */
.badge {
  font-size: 0.8rem;
  padding: 0.4em 0.8em;
}

/* Estilos para alertas */
.alert {
  border-radius: 0.5rem;
  border: none;
}

/* Estilos para el header */
.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.bg-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
}

/* Estilos para edición de asignaciones */
.assignment-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.skills-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.skills-preview .badge {
  font-size: 0.75rem;
}
</style>
