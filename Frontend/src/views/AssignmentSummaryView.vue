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
                <p><strong>Proyecto:</strong> {{ summaryData?.proyecto?.nombre || 'N/A' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Total de Tareas:</strong> {{ summaryData?.resumen?.length || 0 }}</p>
                <p><strong>Tareas Asignadas:</strong> {{ assignedTasksCount }}</p>
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
                <div class="col-md-6">
                  <label for="statusFilter" class="form-label">Filtrar por Estado</label>
                  <select class="form-select" id="statusFilter" v-model="statusFilter" @change="filterAssignments">
                    <option value="">Todos</option>
                    <option value="asignado">Asignadas</option>
                    <option value="sin_asignar">Sin Asignar</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label for="developerFilter" class="form-label">Filtrar por Desarrollador</label>
                  <select class="form-select" id="developerFilter" v-model="developerFilter" @change="filterAssignments">
                    <option value="">Todos los desarrolladores</option>
                    <option v-for="dev in uniqueDevelopers" :key="dev" :value="dev">
                      {{ dev }}
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
                      <h6 class="assignment-title">{{ assignment.tarea }}</h6>
                      <div class="assignment-meta">
                        <span v-if="assignment.asignado" class="badge bg-success">
                          <i class="bi bi-person-check me-1"></i>
                          Asignada a: {{ assignment.asignado }}
                        </span>
                        <span v-else class="badge bg-warning text-dark">
                          <i class="bi bi-exclamation-triangle me-1"></i>
                          Sin asignar
                        </span>
                      </div>
                    </div>
                    <div class="assignment-status">
                      <i v-if="assignment.asignado" class="bi bi-check-circle-fill text-success fs-4"></i>
                      <i v-else class="bi bi-x-circle-fill text-warning fs-4"></i>
                    </div>
                  </div>

                  <!-- Información adicional para tareas asignadas -->
                  <div v-if="assignment.asignado" class="assignment-details">
                    <div class="row">
                      <div class="col-md-6">
                        <p v-if="assignment.horasAsignadasTotales" class="mb-1">
                          <i class="bi bi-clock me-1"></i>
                          <strong>Horas Asignadas:</strong> {{ assignment.horasAsignadasTotales }}h
                        </p>
                        <p v-if="assignment.dias && assignment.dias.length > 0" class="mb-1">
                          <i class="bi bi-calendar me-1"></i>
                          <strong>Días Asignados:</strong> {{ assignment.dias.length }} días
                        </p>
                      </div>
                      <div class="col-md-6">
                        <div v-if="assignment.dias && assignment.dias.length > 0" class="days-list">
                          <small class="text-muted">Fechas asignadas:</small>
                          <div class="days-grid">
                            <span 
                              v-for="(dia, diaIndex) in assignment.dias.slice(0, 3)" 
                              :key="diaIndex"
                              class="day-badge"
                            >
                              {{ formatDate(dia.fecha) }}
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
              <div class="col-md-3">
                <div class="stat-item">
                  <h3 class="text-primary">{{ assignedTasksCount }}</h3>
                  <p class="text-muted">Tareas Asignadas</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="stat-item">
                  <h3 class="text-warning">{{ unassignedTasksCount }}</h3>
                  <p class="text-muted">Sin Asignar</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="stat-item">
                  <h3 class="text-info">{{ uniqueDevelopers.length }}</h3>
                  <p class="text-muted">Desarrolladores</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="stat-item">
                  <h3 class="text-success">{{ totalHoursAssigned }}</h3>
                  <p class="text-muted">Horas Totales</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AssignmentService from '@/services/assignment.service.js';
import ProjectService from '@/services/project.service.js';

export default {
  name: 'AssignmentSummaryView',
  data() {
    return {
      summaryData: null,
      loading: false,
      statusFilter: '',
      developerFilter: '',
      projects: [],
      allAssignments: []
    };
  },
  computed: {
    filteredAssignments() {
      if (!this.summaryData?.resumen) return [];
      
      let filtered = this.summaryData.resumen;
      
      // Filtrar por estado
      if (this.statusFilter === 'asignado') {
        filtered = filtered.filter(a => a.asignado);
      } else if (this.statusFilter === 'sin_asignar') {
        filtered = filtered.filter(a => !a.asignado);
      }
      
      // Filtrar por desarrollador
      if (this.developerFilter) {
        filtered = filtered.filter(a => a.asignado === this.developerFilter);
      }
      
      return filtered;
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
    }
  },
  async mounted() {
    await this.loadSummaryData();
  },
  methods: {
    async loadSummaryData() {
      this.loading = true;
      try {
        // Intentar cargar desde localStorage primero
        const savedData = localStorage.getItem('lastAssignmentData');
        if (savedData) {
          this.summaryData = JSON.parse(savedData);
          console.log('Datos de asignación cargados desde localStorage:', this.summaryData);
        } else {
          console.log('No hay datos de asignación guardados en localStorage');
        }

        // También cargar asignaciones desde el backend
        await this.loadAssignmentsFromBackend();
        
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
                projectName: project.name || project.nombre
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
                  tarea: assignment.tarea?.descripcion || 'Tarea no disponible',
                  asignado: assignment.desarrollador?.nombre || 'Desarrollador no disponible',
                  proyecto: assignment.projectName,
                  horasAsignadasTotales: assignment.horasTotales || 0,
                  dias: assignment.dias || [],
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
    
    filterAssignments() {
      // El filtrado se hace en computed property
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    },
    
    goBack() {
      this.$router.go(-1);
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
</style>