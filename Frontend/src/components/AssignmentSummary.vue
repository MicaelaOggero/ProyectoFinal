<template>
  <div class="assignment-summary">
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="mb-2">
            <i class="bi bi-robot me-2 text-success"></i>
            Resumen de Asignación Automática
          </h1>
          <p class="text-muted mb-0">
            {{ localAssignmentData.message || 'Resultados de la asignación automática de tareas' }}
          </p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left me-1"></i>Volver
          </button>
          <button class="btn btn-primary" @click="exportToPDF" :disabled="!localAssignmentData.resumen || localAssignmentData.resumen.length === 0">
            <i class="bi bi-file-earmark-pdf me-1"></i>Exportar PDF
          </button>
        </div>
      </div>

      <!-- Estadísticas generales -->
      <div class="row mb-4" v-if="localAssignmentData.resumen && localAssignmentData.resumen.length > 0">
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <i class="bi bi-check-circle-fill fs-1 mb-2"></i>
              <h4>{{ assignedTasksCount }}</h4>
              <p class="mb-0">Tareas Asignadas</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body text-center">
              <i class="bi bi-exclamation-triangle-fill fs-1 mb-2"></i>
              <h4>{{ unassignedTasksCount }}</h4>
              <p class="mb-0">Sin Asignar</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <i class="bi bi-clock-fill fs-1 mb-2"></i>
              <h4>{{ totalHoursAssigned }}</h4>
              <p class="mb-0">Horas Totales</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <i class="bi bi-people-fill fs-1 mb-2"></i>
              <h4>{{ uniqueDevelopersCount }}</h4>
              <p class="mb-0">Desarrolladores</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="row mb-4">
        <div class="col-md-4">
          <label for="statusFilter" class="form-label">Filtrar por Estado</label>
          <select class="form-select" id="statusFilter" v-model="statusFilter" @change="applyFilters">
            <option value="">Todos</option>
            <option value="asignada">Asignadas</option>
            <option value="sin-asignar">Sin Asignar</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="developerFilter" class="form-label">Filtrar por Desarrollador</label>
          <select class="form-select" id="developerFilter" v-model="developerFilter" @change="applyFilters">
            <option value="">Todos los desarrolladores</option>
            <option v-for="dev in uniqueDevelopers" :key="dev" :value="dev">{{ dev }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="sortBy" class="form-label">Ordenar por</label>
          <select class="form-select" id="sortBy" v-model="sortBy" @change="applyFilters">
            <option value="fecha">Fecha de inicio</option>
            <option value="desarrollador">Desarrollador</option>
            <option value="horas">Horas asignadas</option>
            <option value="tarea">Nombre de tarea</option>
          </select>
        </div>
      </div>

      <!-- Lista de asignaciones -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-list-task me-2"></i>
            Detalle de Asignaciones
          </h5>
        </div>
        <div class="card-body">
          <div v-if="filteredAssignments.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 mb-3"></i>
            <p class="fs-5">No hay asignaciones que coincidan con los filtros</p>
          </div>
          <div v-else>
            <div v-for="(assignment, index) in filteredAssignments" :key="index" class="assignment-item mb-4">
              <!-- Header de la asignación -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="flex-grow-1">
                  <h6 class="mb-1 fw-bold text-primary">{{ assignment.tarea }}</h6>
                  <div v-if="assignment.asignado" class="text-success">
                    <i class="bi bi-person-check me-1"></i>
                    Asignada a: <strong>{{ assignment.asignado }}</strong>
                  </div>
                  <div v-else-if="assignment.motivo" class="text-warning">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    {{ assignment.motivo }}
                  </div>
                </div>
                <div class="text-end">
                  <span v-if="assignment.asignado" class="badge bg-success fs-6 px-3 py-2">
                    <i class="bi bi-check-circle me-1"></i>Asignada
                  </span>
                  <span v-else class="badge bg-warning text-dark fs-6 px-3 py-2">
                    <i class="bi bi-exclamation-triangle me-1"></i>Sin Asignar
                  </span>
                </div>
              </div>

              <!-- Detalles de la asignación -->
              <div v-if="assignment.asignado" class="assignment-details">
                <div class="row">
                  <div class="col-md-6">
                    <div class="detail-item">
                      <i class="bi bi-clock me-2 text-info"></i>
                      <strong>Horas Totales:</strong> {{ assignment.horasAsignadasTotales }} horas
                    </div>
                    <div class="detail-item" v-if="assignment.dias && assignment.dias.length > 0">
                      <i class="bi bi-calendar me-2 text-info"></i>
                      <strong>Días de trabajo:</strong> {{ assignment.dias.length }} días
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="detail-item" v-if="assignment.dias && assignment.dias.length > 0">
                      <i class="bi bi-calendar-event me-2 text-info"></i>
                      <strong>Período:</strong> 
                      {{ formatDate(assignment.dias[0].inicio) }} - 
                      {{ formatDate(assignment.dias[assignment.dias.length - 1].inicio) }}
                    </div>
                  </div>
                </div>

                <!-- Cronograma detallado -->
                <div v-if="assignment.dias && assignment.dias.length > 0" class="mt-3">
                  <h6 class="mb-2">
                    <i class="bi bi-calendar-week me-2"></i>Cronograma Detallado
                  </h6>
                  <div class="timeline">
                    <div v-for="(dia, diaIndex) in assignment.dias" :key="diaIndex" class="timeline-item">
                      <div class="timeline-marker">
                        <i class="bi bi-circle-fill"></i>
                      </div>
                      <div class="timeline-content">
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{{ formatDate(dia.inicio) }}</strong>
                            <span class="text-muted ms-2">({{ getDayName(dia.inicio) }})</span>
                          </div>
                          <span class="badge bg-primary">{{ dia.horasAsignadas }} horas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen por desarrollador -->
      <div v-if="developerSummary.length > 0" class="card mt-4">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-person-lines-fill me-2"></i>
            Resumen por Desarrollador
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div v-for="summary in developerSummary" :key="summary.desarrollador" class="col-md-6 col-lg-4 mb-3">
              <div class="card border-primary">
                <div class="card-body">
                  <h6 class="card-title text-primary">
                    <i class="bi bi-person me-1"></i>{{ summary.desarrollador }}
                  </h6>
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="border-end">
                        <h4 class="text-success mb-0">{{ summary.tareas }}</h4>
                        <small class="text-muted">Tareas</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <h4 class="text-info mb-0">{{ summary.horas }}</h4>
                      <small class="text-muted">Horas</small>
                    </div>
                  </div>
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
export default {
  name: 'AssignmentSummary',
  props: {
    assignmentData: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  data() {
    return {
      statusFilter: '',
      developerFilter: '',
      sortBy: 'fecha',
      filteredAssignments: [],
      localAssignmentData: {}
    };
  },
  computed: {
    assignedTasksCount() {
      if (!this.localAssignmentData.resumen) return 0;
      return this.localAssignmentData.resumen.filter(a => a.asignado).length;
    },
    unassignedTasksCount() {
      if (!this.localAssignmentData.resumen) return 0;
      return this.localAssignmentData.resumen.filter(a => !a.asignado).length;
    },
    totalHoursAssigned() {
      if (!this.localAssignmentData.resumen) return 0;
      return this.localAssignmentData.resumen.reduce((total, a) => total + (a.horasAsignadasTotales || 0), 0);
    },
    uniqueDevelopers() {
      if (!this.localAssignmentData.resumen) return [];
      const developers = this.localAssignmentData.resumen
        .filter(a => a.asignado)
        .map(a => a.asignado);
      return [...new Set(developers)];
    },
    uniqueDevelopersCount() {
      return this.uniqueDevelopers.length;
    },
    developerSummary() {
      if (!this.localAssignmentData.resumen) return [];
      
      const summary = {};
      this.localAssignmentData.resumen.forEach(assignment => {
        if (assignment.asignado) {
          if (!summary[assignment.asignado]) {
            summary[assignment.asignado] = {
              desarrollador: assignment.asignado,
              tareas: 0,
              horas: 0
            };
          }
          summary[assignment.asignado].tareas++;
          summary[assignment.asignado].horas += assignment.horasAsignadasTotales || 0;
        }
      });
      
      return Object.values(summary);
    }
  },
  mounted() {
    this.applyFilters();
  },
  methods: {
    applyFilters() {
      console.log('🔍 AssignmentSummary - Aplicando filtros...');
      console.log('🔍 AssignmentSummary - Datos originales:', this.localAssignmentData);
      console.log('🔍 AssignmentSummary - Resumen original:', this.localAssignmentData.resumen);
      
      let filtered = [...(this.localAssignmentData.resumen || [])];
      console.log('🔍 AssignmentSummary - Array inicial:', filtered);
      
      // Filtrar por estado
      if (this.statusFilter === 'asignada') {
        console.log('🔍 AssignmentSummary - Filtrando por asignadas...');
        filtered = filtered.filter(a => a.asignado);
        console.log('🔍 AssignmentSummary - Después del filtro asignadas:', filtered);
      } else if (this.statusFilter === 'sin-asignar') {
        console.log('🔍 AssignmentSummary - Filtrando por sin asignar...');
        filtered = filtered.filter(a => !a.asignado);
        console.log('🔍 AssignmentSummary - Después del filtro sin asignar:', filtered);
      }
      
      // Filtrar por desarrollador
      if (this.developerFilter) {
        filtered = filtered.filter(a => a.asignado === this.developerFilter);
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'fecha': {
            const dateA = a.dias && a.dias.length > 0 ? new Date(a.dias[0].inicio) : new Date();
            const dateB = b.dias && b.dias.length > 0 ? new Date(b.dias[0].inicio) : new Date();
            return dateA - dateB;
          }
          case 'desarrollador':
            return (a.asignado || '').localeCompare(b.asignado || '');
          case 'horas':
            return (b.horasAsignadasTotales || 0) - (a.horasAsignadasTotales || 0);
          case 'tarea':
            return a.tarea.localeCompare(b.tarea);
          default:
            return 0;
        }
      });
      
      console.log('🔍 AssignmentSummary - Resultado final filtrado:', filtered);
      this.filteredAssignments = filtered;
      console.log('🔍 AssignmentSummary - filteredAssignments actualizado:', this.filteredAssignments);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    getDayName(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return days[date.getDay()];
    },
    goBack() {
      this.$emit('go-back');
    },
    exportToPDF() {
      // TODO: Implementar exportación a PDF
      alert('Función de exportación a PDF próximamente disponible');
    }
  },
  watch: {
    assignmentData: {
      handler(newData) {
        this.localAssignmentData = { ...newData };
        this.applyFilters();
      },
      deep: true,
      immediate: true
    }
  }
};
</script>

<style scoped>
.assignment-summary {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 0.5rem;
}

.assignment-item {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border-left: 4px solid #28a745;
  transition: all 0.3s ease;
}

.assignment-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.detail-item {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #dee2e6;
}

.timeline-item {
  position: relative;
  margin-bottom: 1rem;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 0.25rem;
  width: 1rem;
  height: 1rem;
  background: white;
  border: 2px solid #0d6efd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-marker i {
  font-size: 0.5rem;
  color: #0d6efd;
}

.timeline-content {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
}

.badge {
  font-size: 0.8rem;
}

.fs-1 {
  font-size: 2.5rem !important;
}

@media (max-width: 768px) {
  .assignment-item {
    padding: 1rem;
  }
  
  .timeline {
    padding-left: 1.5rem;
  }
  
  .timeline-marker {
    left: -1.5rem;
  }
}
</style>
