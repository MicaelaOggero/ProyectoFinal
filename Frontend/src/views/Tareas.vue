<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>{{ isUserAdmin ? 'Gestión de Tareas' : 'Mis Tareas Asignadas' }}</h1>
      <div class="d-flex gap-2">
        <button v-if="isUserAdmin" class="btn btn-success" @click="openAssignmentTypeModal">
          <i class="bi bi-robot me-1"></i>
          Asignación Automática
        </button>
        <button v-if="isUserAdmin" class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-circle me-1"></i>Crear Nueva Tarea
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="row mb-4">
      <div v-if="isUserAdmin" class="col-md-4">
        <label for="projectFilter" class="form-label">Filtrar por Proyecto</label>
        <select class="form-select" id="projectFilter" v-model="selectedProject" @change="onProjectChange">
          <option value="">Todos los proyectos</option>
          <option v-for="project in projects" :key="project._id" :value="project._id">
            {{ project.name }}
          </option>
        </select>
      </div>
      <div v-else class="col-md-4">
        <label for="projectFilter" class="form-label">Proyectos de Mis Tareas</label>
        <select class="form-select" id="projectFilter" v-model="selectedProject" @change="onProjectChange">
          <option value="">Todos mis proyectos</option>
          <option v-for="project in projects" :key="project._id" :value="project._id">
            {{ project.name }}
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

    <!-- Resultados de Asignación Automática (Solo Admin) -->
    <div v-if="isUserAdmin && assignmentResults.length > 0" class="card mb-4">
      <div class="card-header bg-success text-white">
        <h5 class="mb-0"><i class="bi bi-robot me-2"></i>Resultados de Asignación Automática con Calendario</h5>
      </div>
      <div class="card-body">
        <div v-for="result in assignmentResults" :key="result.tareaId || result.taskId" class="assignment-item mb-3">
          <div class="d-flex justify-content-between align-items-start">
            <div class="assignment-info flex-grow-1">
              <strong>{{ result.tarea }}</strong>
              <div v-if="result.asignado" class="mt-2">
                <span class="text-success d-block">
                  <i class="bi bi-check-circle me-1"></i>Asignada a: {{ result.asignado }}
                </span>
                <span v-if="result.horasAsignadasTotales > 0" class="text-muted small d-block">
                  <i class="bi bi-clock me-1"></i>{{ result.horasAsignadasTotales }} horas asignadas
                </span>
                <div v-if="result.dias && result.dias.length > 0" class="mt-1">
                  <small class="text-info">
                    <i class="bi bi-calendar me-1"></i>
                    Días asignados: {{ result.dias.length }} días
                  </small>
                </div>
              </div>
              <div v-else-if="result.motivo" class="mt-2">
                <span class="text-warning d-block">
                  <i class="bi bi-exclamation-triangle me-1"></i>{{ result.motivo }}
                </span>
              </div>
            </div>
            <div class="assignment-status">
              <span v-if="result.asignado" class="badge bg-success">
                <i class="bi bi-check-circle me-1"></i>Asignada
              </span>
              <span v-else class="badge bg-warning text-dark">
                <i class="bi bi-exclamation-triangle me-1"></i>Sin asignar
              </span>
            </div>
          </div>
        </div>
        <div class="text-end mt-3">
          <button class="btn btn-info btn-sm me-2" @click="viewDetailedSummary" v-if="assignmentResults.length > 0">
            <i class="bi bi-eye me-1"></i>Ver Resumen Detallado
          </button>
          <button class="btn btn-outline-success btn-sm" @click="clearAssignmentResults">
            <i class="bi bi-x-circle me-1"></i>Cerrar
          </button>
        </div>
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
                    <button 
                      v-if="isUserAdmin"
                      class="btn btn-sm btn-outline-warning" 
                      @click="editTask(task)" 
                      title="Editar"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                      v-if="isUserAdmin"
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
                      {{ project.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="row">
                <div class="col-md-12 mb-3">
                  <label for="taskSkills" class="form-label">Habilidades Requeridas *</label>
                  
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
                        :disabled="taskForm.habilidadesRequeridas.includes(skill.nombre || skill)"
                        :title="taskForm.habilidadesRequeridas.includes(skill.nombre || skill) ? 'Ya seleccionada' : 'Agregar habilidad'"
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
                      id="taskSkills" 
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
                  <label for="taskTimeSpent" class="form-label">Tiempo Invertido (horas)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="taskTimeSpent" 
                    v-model="taskForm.tiempoInvertidoHoras"
                    min="0"
                    step="0.5"
                  >
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="taskEstimatedStart" class="form-label">Fecha Estimada de Inicio</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="taskEstimatedStart" 
                    v-model="taskForm.fechaEstimadaInicio"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="taskEstimatedEnd" class="form-label">Fecha Estimada de Fin</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="taskEstimatedEnd" 
                    v-model="taskForm.fechaEstimadaFin"
                  >
                </div>
              </div>

              <!-- Las fechas reales se toman automáticamente según el estado de la tarea -->
              <div v-if="taskForm.estado === 'en curso' || taskForm.estado === 'completada'" class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Fecha Real de Inicio</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="taskForm.fechaRealInicio"
                    readonly
                    style="background-color: #f8f9fa;"
                  >
                  <small class="form-text text-muted">Se establece automáticamente al cambiar a "En Curso"</small>
                </div>
                <div class="col-md-6 mb-3" v-if="taskForm.estado === 'completada'">
                  <label class="form-label">Fecha Real de Fin</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="taskForm.fechaRealFin"
                    readonly
                    style="background-color: #f8f9fa;"
                  >
                  <small class="form-text text-muted">Se establece automáticamente al cambiar a "Completada"</small>
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
                <p v-if="selectedTask.tiempoInvertidoHoras">
                  <strong>Tiempo Invertido:</strong> {{ selectedTask.tiempoInvertidoHoras }} horas
                </p>
                <p v-if="selectedTask.fechaEstimadaInicio">
                  <strong>Fecha Estimada Inicio:</strong> {{ formatDate(selectedTask.fechaEstimadaInicio) }}
                </p>
                <p v-if="selectedTask.fechaEstimadaFin">
                  <strong>Fecha Estimada Fin:</strong> {{ formatDate(selectedTask.fechaEstimadaFin) }}
                </p>
                <p v-if="selectedTask.fechaRealInicio">
                  <strong>Fecha Real Inicio:</strong> {{ formatDate(selectedTask.fechaRealInicio) }}
                </p>
                <p v-if="selectedTask.fechaRealFin">
                  <strong>Fecha Real Fin:</strong> {{ formatDate(selectedTask.fechaRealFin) }}
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


    <!-- Modal para Seleccionar Tipo de Asignación Automática -->
    <div class="modal fade" id="assignmentTypeModal" tabindex="-1" aria-labelledby="assignmentTypeModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="assignmentTypeModalLabel">
              <i class="bi bi-robot me-2"></i>Asignación Automática
              <span v-if="previewData" class="badge bg-info ms-2">Previsualización</span>
            </h5>
            <button type="button" class="btn-close" @click="closeAssignmentTypeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Paso 1: Selección de tipo (si no hay preview) -->
            <div v-if="!previewData">
              <p class="mb-4">Selecciona el tipo de optimización para la asignación automática:</p>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card h-100 assignment-option-card" @click="selectAssignmentType('availability')" :class="{ 'selected': selectedAssignmentType === 'availability' }">
                    <div class="card-body text-center">
                      <div class="assignment-icon mb-3">
                        <i class="bi bi-clock-history fs-1 text-primary"></i>
                      </div>
                      <h6 class="card-title">Por Disponibilidad y Habilidades</h6>
                      <p class="card-text small text-muted">
                        Tener el proyecto en menor tiempo posible
                      </p>
                      <div class="assignment-features">
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Optimiza tiempo de finalización
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Considera calendario de desarrolladores
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Prioriza habilidades requeridas
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <div class="card h-100 assignment-option-card" @click="selectAssignmentType('cost')" :class="{ 'selected': selectedAssignmentType === 'cost' }">
                    <div class="card-body text-center">
                      <div class="assignment-icon mb-3">
                        <i class="bi bi-currency-dollar fs-1 text-success"></i>
                      </div>
                      <h6 class="card-title">Por Costo</h6>
                      <p class="card-text small text-muted">
                        Un proyecto más barato
                      </p>
                      <div class="assignment-features">
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Minimiza costos totales
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Considera tarifas por hora
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Optimiza presupuesto
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <div class="card h-100 assignment-option-card" @click="selectAssignmentType('time')" :class="{ 'selected': selectedAssignmentType === 'time' }">
                    <div class="card-body text-center">
                      <div class="assignment-icon mb-3">
                        <i class="bi bi-hourglass-split fs-1 text-warning"></i>
                      </div>
                      <h6 class="card-title">Por Tiempo (IA)</h6>
                      <p class="card-text small text-muted">
                        Optimiza la asignación para reducir tiempos
                      </p>
                      <div class="assignment-features">
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          IA optimiza tiempos de entrega
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Considera experiencia y eficiencia
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Asignación inteligente
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <div class="card h-100 assignment-option-card" @click="selectAssignmentType('quality')" :class="{ 'selected': selectedAssignmentType === 'quality' }">
                    <div class="card-body text-center">
                      <div class="assignment-icon mb-3">
                        <i class="bi bi-star-fill fs-1 text-info"></i>
                      </div>
                      <h6 class="card-title">Por Calidad (IA)</h6>
                      <p class="card-text small text-muted">
                        Prioriza la calidad del trabajo entregado
                      </p>
                      <div class="assignment-features">
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          IA maximiza calidad de código
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Asigna a los mejores perfiles
                        </small><br>
                        <small class="text-success">
                          <i class="bi bi-check-circle me-1"></i>
                          Entrega de alta calidad
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paso 2: Preview de asignaciones (si hay preview) -->
            <div v-else>
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Previsualización de Asignaciones</strong>
                <p class="mb-0 mt-2">
                  {{ previewData.message }}
                </p>
              </div>

              <!-- Tabla de preview -->
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Tarea</th>
                      <th>Desarrollador Sugerido</th>
                      <th>Horas Totales</th>
                      <th>Días Asignados</th>
                      <th v-if="selectedAssignmentType === 'cost'">Costo por Hora</th>
                      <th v-if="selectedAssignmentType === 'cost'">Costo Total</th>
                      <th v-if="selectedAssignmentType === 'time' || selectedAssignmentType === 'quality'">Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(asignacion, index) in (previewData.asignaciones || previewData.sugerencias)" :key="index">
                      <td>
                        <strong>{{ asignacion.tarea?.descripcion || asignacion.descripcion || 'Tarea sin descripción' }}</strong>
                      </td>
                      <td>
                        <span v-if="asignacion.desarrollador || asignacion.desarrolladorAsignado">
                          <i class="bi bi-person-check text-success me-1"></i>
                          {{ asignacion.desarrollador?.nombre || asignacion.desarrolladorAsignado?.nombre || '' }} {{ asignacion.desarrollador?.apellido || asignacion.desarrolladorAsignado?.apellido || '' }}
                        </span>
                        <span v-else class="text-warning">
                          <i class="bi bi-exclamation-triangle me-1"></i>
                          {{ asignacion.motivo || 'Sin asignar' }}
                        </span>
                      </td>
                      <td>
                        <span v-if="asignacion.horasTotales || asignacion.horasAsignadas">
                          <i class="bi bi-clock me-1"></i>
                          {{ asignacion.horasTotales || asignacion.horasAsignadas }}h
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>
                        <span v-if="asignacion.dias && asignacion.dias.length > 0">
                          <i class="bi bi-calendar-week me-1"></i>
                          {{ asignacion.dias.length }} días
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td v-if="selectedAssignmentType === 'cost'">
                        <span v-if="asignacion.desarrollador">
                          ${{ asignacion.desarrollador.costoPorHora }}/h
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td v-if="selectedAssignmentType === 'cost'">
                        <span v-if="asignacion.costoTotal" class="fw-bold text-success">
                          ${{ asignacion.costoTotal.toFixed(2) }}
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td v-if="selectedAssignmentType === 'time' || selectedAssignmentType === 'quality'">
                        <span v-if="asignacion.razon" class="small text-muted">
                          {{ asignacion.razon }}
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Resumen total -->
              <div class="alert alert-success mt-3" v-if="previewData.costoTotalProyecto">
                <div class="d-flex justify-content-between align-items-center">
                  <strong>
                    <i class="bi bi-currency-dollar me-2"></i>
                    Costo Total del Proyecto:
                  </strong>
                  <h4 class="mb-0 text-success">
                    ${{ previewData.costoTotalProyecto.toFixed(2) }}
                  </h4>
                </div>
              </div>

              <!-- Pregunta de confirmación -->
              <div class="alert alert-warning mt-3">
                <i class="bi bi-question-circle me-2"></i>
                <strong>¿Desea guardar estas asignaciones?</strong>
                <p class="mb-0 mt-2 small">
                  Una vez confirmadas, las tareas serán asignadas a los desarrolladores y sus calendarios se actualizarán automáticamente.
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAssignmentTypeModal">
              {{ previewData ? 'Cancelar' : 'Cerrar' }}
            </button>
            
            <!-- Botón para generar preview -->
            <button 
              v-if="!previewData"
              type="button" 
              class="btn btn-primary" 
              @click="generatePreview"
              :disabled="!selectedAssignmentType || isLoadingPreview"
            >
              <span v-if="isLoadingPreview" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <i v-else class="bi bi-eye me-2"></i>
              {{ isLoadingPreview ? 'Generando...' : 'Ver Previsualización' }}
            </button>
            
            <!-- Botones para confirmar o volver -->
            <template v-else>
              <button 
                type="button" 
                class="btn btn-outline-primary" 
                @click="backToSelection"
              >
                <i class="bi bi-arrow-left me-2"></i>
                Volver a Selección
              </button>
              <button 
                type="button" 
                class="btn btn-success" 
                @click="confirmAssignment"
                :disabled="isConfirming"
              >
                <span v-if="isConfirming" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                {{ isConfirming ? 'Guardando...' : 'Confirmar y Guardar' }}
              </button>
            </template>
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
import AssignmentService from '../services/assignment.service.js';
import ValidationService from '../services/validation.service.js';
import SkillsService from '../services/skills.service.js';

export default {
  name: 'TareasView',
  data() {
    return {
      // Modales
      taskModalInstance: null,
      viewModalInstance: null,
      assignmentTypeModalInstance: null,
      
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
        fechaEstimadaFin: '',
        fechaEstimadaInicio: '',
        tiempoInvertidoHoras: 0,
        fechaRealInicio: '',
        fechaRealFin: ''
      },
      
      // Input para habilidades
      skillInput: '',
      
      // Habilidades disponibles
      availableSkills: [],
      
      // Tarea seleccionada para ver detalles
      selectedTask: null,
      
      
      // Asignación automática
      assignmentResults: [],
      isAssigning: false,
      selectedAssignmentType: null, // 'availability' o 'cost'
      
      // Preview y confirmación
      previewData: null,
      isLoadingPreview: false,
      isConfirming: false
    };
  },
  computed: {
    isUserAdmin() {
      return this.user && this.user.rol === 'admin';
    }
  },
  watch: {
    // Watcher para establecer fechas automáticamente cuando cambia el estado
    'taskForm.estado'(newEstado, oldEstado) {
      const today = new Date().toISOString().split('T')[0];
      
      // Si cambia a "en curso" y no tiene fecha real de inicio, establecerla
      if (newEstado === 'en curso' && oldEstado !== 'en curso' && !this.taskForm.fechaRealInicio) {
        this.taskForm.fechaRealInicio = today;
      }
      
      // Si cambia a "completada" y no tiene fecha real de fin, establecerla
      if (newEstado === 'completada' && oldEstado !== 'completada' && !this.taskForm.fechaRealFin) {
        this.taskForm.fechaRealFin = today;
      }
    }
  },
  async mounted() {
    this.taskModalInstance = new Modal(document.getElementById('taskModal'));
    this.viewModalInstance = new Modal(document.getElementById('viewTaskModal'));
    this.assignmentTypeModalInstance = new Modal(document.getElementById('assignmentTypeModal'));
    
    // Cargar usuario actual
    this.user = await AuthService.getCurrentUser();
    
    // Cargar datos iniciales
    await this.loadProjects();
    await this.loadUsers();
    await this.loadSkills();
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
    
    // Cargar habilidades
    async loadSkills() {
      try {
        const response = await SkillsService.getSkills();
        this.availableSkills = response.data || [];
      } catch (error) {
        console.error('Error cargando habilidades:', error);
        this.availableSkills = [];
      }
    },
    
    // Cargar tareas
    async loadTasks() {
      this.loading = true;
      try {
        if (this.isUserAdmin) {
          // Lógica para administradores: cargar todos los proyectos y tareas
          if (this.projects.length === 0) {
            await this.loadProjects();
          }
          
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
        } else {
          // Lógica para usuarios normales: cargar solo sus tareas asignadas
          const userTasks = await TaskService.getTasksByDeveloper(this.user._id);
          this.tasks = userTasks || [];
          
          // Para usuarios normales, las tareas ya vienen con el proyecto populado desde el backend
          // Extraer proyectos únicos de las tareas
          const uniqueProjects = new Map();
          this.tasks.forEach(task => {
            if (task.proyecto && task.proyecto._id) {
              const mappedProject = {
                _id: task.proyecto._id,
                name: task.proyecto.nombre,
                nombre: task.proyecto.nombre
              };
              uniqueProjects.set(task.proyecto._id, mappedProject);
            }
          });
          
          this.projects = Array.from(uniqueProjects.values());
        }
        
        // Ordenar tareas por prioridad y dificultad
        this.tasks = ValidationService.sortTasksByPriority(this.tasks);
        
        this.filterTasks();
      } catch (error) {
        console.error('Error cargando tareas:', error);
        this.tasks = [];
      } finally {
        this.loading = false;
      }
    },
    
    // Manejar cambio de proyecto
    onProjectChange() {
      if (this.isUserAdmin) {
        // Solo los admins pueden filtrar por proyecto específico
        this.loadTasks();
      } else {
        // Para usuarios normales, no aplicar filtro de proyecto (ya que solo ven sus tareas)
        this.filterTasks();
      }
    },
    
    // Filtrar tareas
    filterTasks() {
      this.filteredTasks = this.tasks.filter(task => {
        const statusMatch = !this.selectedStatus || task.estado === this.selectedStatus;
        const priorityMatch = !this.selectedPriority || task.prioridad === this.selectedPriority;
        
        // Para usuarios no admin, también aplicar filtro de proyecto si está seleccionado
        let projectMatch = true;
        if (!this.isUserAdmin && this.selectedProject) {
          // Manejar tanto proyecto populado como ID
          const taskProjectId = typeof task.proyecto === 'object' ? task.proyecto._id : task.proyecto;
          projectMatch = taskProjectId === this.selectedProject;
        }
        
        return statusMatch && priorityMatch && projectMatch;
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
      const today = new Date().toISOString().split('T')[0];
      
      // Establecer fechas reales automáticamente según el estado actual
      let fechaRealInicio = task.fechaRealInicio ? this.formatDateForInput(task.fechaRealInicio) : '';
      let fechaRealFin = task.fechaRealFin ? this.formatDateForInput(task.fechaRealFin) : '';
      
      // Si está en curso o completada y no tiene fecha real de inicio, establecerla
      if ((task.estado === 'en curso' || task.estado === 'completada') && !fechaRealInicio) {
        fechaRealInicio = today;
      }
      
      // Si está completada y no tiene fecha real de fin, establecerla
      if (task.estado === 'completada' && !fechaRealFin) {
        fechaRealFin = today;
      }
      
      // Manejar desarrollador asignado (puede venir como objeto poblado o como string ID)
      let desarrolladorAsignado = '';
      if (task.desarrolladorAsignado) {
        if (typeof task.desarrolladorAsignado === 'object' && task.desarrolladorAsignado._id) {
          desarrolladorAsignado = task.desarrolladorAsignado._id;
        } else if (typeof task.desarrolladorAsignado === 'string') {
          desarrolladorAsignado = task.desarrolladorAsignado;
        }
      }
      
      this.taskForm = {
        _id: task._id, // Guardar el ID de la tarea
        descripcion: task.descripcion || '',
        habilidadesRequeridas: [...(task.habilidadesRequeridas || [])],
        nivelDificultad: task.nivelDificultad ? task.nivelDificultad.toString() : '',
        prioridad: task.prioridad || '',
        estado: task.estado || 'pendiente',
        proyecto: task.proyecto || '',
        desarrolladorAsignado: desarrolladorAsignado,
        tiempoEstimadoHoras: task.tiempoEstimadoHoras || null,
        fechaEstimadaFin: task.fechaEstimadaFin ? this.formatDateForInput(task.fechaEstimadaFin) : '',
        fechaEstimadaInicio: task.fechaEstimadaInicio ? this.formatDateForInput(task.fechaEstimadaInicio) : '',
        tiempoInvertidoHoras: task.tiempoInvertidoHoras || 0,
        fechaRealInicio: fechaRealInicio,
        fechaRealFin: fechaRealFin
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
        // Validaciones básicas
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

        // Validación de horas para tareas del mismo día
        if (this.taskForm.fechaEstimadaInicio && this.taskForm.fechaEstimadaFin && this.taskForm.tiempoEstimadoHoras) {
          const sameDayValidation = ValidationService.validateSameDayHours({
            fechaEstimadaInicio: this.taskForm.fechaEstimadaInicio,
            fechaEstimadaFin: this.taskForm.fechaEstimadaFin,
            tiempoEstimadoHoras: this.taskForm.tiempoEstimadoHoras
          });
          
          if (!sameDayValidation.isValid) {
            throw new Error(sameDayValidation.message);
          }
        }

        // Validación de disponibilidad del desarrollador si está asignado
        if (this.taskForm.desarrolladorAsignado && this.taskForm.fechaEstimadaInicio && this.taskForm.fechaEstimadaFin && this.taskForm.tiempoEstimadoHoras) {
          const developerId = typeof this.taskForm.desarrolladorAsignado === 'object' 
            ? this.taskForm.desarrolladorAsignado._id 
            : this.taskForm.desarrolladorAsignado;

          const availabilityValidation = await ValidationService.validateDeveloperAvailability(
            developerId,
            this.taskForm.fechaEstimadaInicio,
            this.taskForm.fechaEstimadaFin,
            this.taskForm.tiempoEstimadoHoras
          );

          if (!availabilityValidation.isValid) {
            throw new Error(availabilityValidation.message);
          }
        }
        
        // Preparar datos para envío
        if (this.isEditing) {
          // Actualizar tarea existente - NO incluir el campo proyecto
          const updateData = {
            descripcion: this.taskForm.descripcion,
            habilidadesRequeridas: this.taskForm.habilidadesRequeridas,
            nivelDificultad: parseInt(this.taskForm.nivelDificultad),
            prioridad: this.taskForm.prioridad,
            estado: this.taskForm.estado,
            desarrolladorAsignado: this.taskForm.desarrolladorAsignado || null,
            tiempoEstimadoHoras: this.taskForm.tiempoEstimadoHoras || null,
            fechaEstimadaFin: this.taskForm.fechaEstimadaFin || null,
            fechaEstimadaInicio: this.taskForm.fechaEstimadaInicio || null,
            tiempoInvertidoHoras: this.taskForm.tiempoInvertidoHoras || 0,
            fechaRealInicio: this.taskForm.fechaRealInicio || null,
            fechaRealFin: this.taskForm.fechaRealFin || null
          };
          await TaskService.updateTask(this.taskForm._id, updateData);
        } else {
          // Crear nueva tarea
          const projectId = this.taskForm.proyecto;
          
          // Crear taskData sin el campo proyecto (ya que va en la URL)
          const taskDataForAPI = {
            descripcion: this.taskForm.descripcion,
            habilidadesRequeridas: this.taskForm.habilidadesRequeridas,
            nivelDificultad: parseInt(this.taskForm.nivelDificultad),
            prioridad: this.taskForm.prioridad,
            estado: this.taskForm.estado,
            desarrolladorAsignado: this.taskForm.desarrolladorAsignado || null,
            tiempoEstimadoHoras: this.taskForm.tiempoEstimadoHoras || null,
            fechaEstimadaFin: this.taskForm.fechaEstimadaFin || null,
            fechaEstimadaInicio: this.taskForm.fechaEstimadaInicio || null,
            tiempoInvertidoHoras: this.taskForm.tiempoInvertidoHoras || 0,
            fechaRealInicio: this.taskForm.fechaRealInicio || null,
            fechaRealFin: this.taskForm.fechaRealFin || null
          };
          
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
    
    // Agregar habilidad desde la lista disponible
    addSkillFromList(skill) {
      if (!this.taskForm.habilidadesRequeridas.includes(skill)) {
        this.taskForm.habilidadesRequeridas.push(skill);
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
    
    
    
    
    // Métodos auxiliares
    getCurrentDeveloperId(desarrolladorAsignado) {
      if (typeof desarrolladorAsignado === 'object' && desarrolladorAsignado._id) {
        return desarrolladorAsignado._id;
      }
      return desarrolladorAsignado;
    },
    
    getDeveloperName(developer) {
      if (!developer) return 'Sin asignar';
      
      if (typeof developer === 'object') {
        return developer.nombre ? `${developer.nombre} ${developer.apellido || ''}`.trim() : developer.email || 'Usuario desconocido';
      }
      
      // Si es solo un ID, buscar en la lista de usuarios
      const user = this.users.find(u => u._id === developer);
      return user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Usuario no encontrado';
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
        fechaEstimadaFin: '',
        fechaEstimadaInicio: '',
        tiempoInvertidoHoras: 0,
        fechaRealInicio: '',
        fechaRealFin: ''
      };
      this.skillInput = '';
      this.errorMessage = '';
    },
    
    // Utilidades
    getProjectName(projectId) {
      if (!projectId) {
        return 'Sin proyecto';
      }
      
      // Si projectId es un objeto (proyecto populado), usar directamente
      if (typeof projectId === 'object' && projectId._id) {
        return projectId.nombre || projectId.name || 'Proyecto sin nombre';
      }
      
      // Si projectId es un string (ID), buscar en la lista de proyectos
      const project = this.projects.find(p => p._id === projectId);
      
      if (project) {
        return project.nombre || project.name || 'Proyecto sin nombre';
      }
      
      // Si no se encuentra el proyecto, mostrar el ID como fallback
      return `Proyecto (${projectId.substring(0, 8)}...)`;
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
      // Usar métodos UTC para evitar cambios por zona horaria
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    },
    
    formatDateForInput(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    // Métodos de asignación automática
    async runAutoAssignment() {
      this.isAssigning = true;
      this.assignmentResults = [];
      
      try {
        // Determinar qué proyecto procesar
        let projectsToProcess = [];
        
        if (this.selectedProject) {
          const selectedProj = this.projects.find(p => p._id === this.selectedProject);
          if (selectedProj) {
            projectsToProcess = [selectedProj];
          }
        } else {
          projectsToProcess = this.projects;
        }
        
        // Ejecutar asignación para los proyectos determinados
        for (const project of projectsToProcess) {
          try {
            const resultado = await AssignmentService.runAutomaticAssignment(project._id);
            
            // Agregar resultados del proyecto
            if (resultado.resumen && resultado.resumen.length > 0) {
              this.assignmentResults.push(...resultado.resumen);
            }
          } catch (error) {
            console.error('Error en asignación automática para proyecto', project.name, ':', error);
          }
        }
        
        // Guardar los datos de asignación en localStorage
        const assignmentData = {
          message: "Asignación automática con calendario diario completada",
          resumen: this.assignmentResults,
          fechaGeneracion: new Date().toISOString(),
          proyecto: this.projects[0]
        };
        localStorage.setItem('lastAssignmentData', JSON.stringify(assignmentData));
        
        // Recargar las tareas para mostrar los cambios
        await this.loadTasks();
        
      } catch (error) {
        console.error('Error ejecutando asignación automática:', error);
        alert('Error ejecutando asignación automática: ' + error.message);
      } finally {
        this.isAssigning = false;
      }
    },

    clearAssignmentResults() {
      this.assignmentResults = [];
    },

    // Métodos para el modal de selección de tipo de asignación
    openAssignmentTypeModal() {
      this.selectedAssignmentType = null;
      this.previewData = null;
      this.isLoadingPreview = false;
      this.isConfirming = false;
      this.assignmentTypeModalInstance.show();
    },

    closeAssignmentTypeModal() {
      this.selectedAssignmentType = null;
      this.previewData = null;
      this.isLoadingPreview = false;
      this.isConfirming = false;
      this.assignmentTypeModalInstance.hide();
    },

    selectAssignmentType(type) {
      this.selectedAssignmentType = type;
    },

    // Generar previsualización
    async generatePreview() {
      if (!this.selectedAssignmentType || !this.selectedProject) {
        alert('Por favor selecciona un proyecto antes de generar la previsualización');
        return;
      }

      this.isLoadingPreview = true;

      try {
        let previewResult;
        
        if (this.selectedAssignmentType === 'availability') {
          previewResult = await AssignmentService.previewBasicAssignment(this.selectedProject);
        } else if (this.selectedAssignmentType === 'cost') {
          previewResult = await AssignmentService.previewCostAssignment(this.selectedProject);
        } else if (this.selectedAssignmentType === 'time') {
          previewResult = await AssignmentService.previewTimeAssignment(this.selectedProject);
        } else if (this.selectedAssignmentType === 'quality') {
          previewResult = await AssignmentService.previewQualityAssignment(this.selectedProject);
        }

        this.previewData = previewResult;

        const hasAssignments = previewResult.asignaciones?.length > 0 || previewResult.sugerencias?.length > 0;
        if (!hasAssignments) {
          alert('No se encontraron tareas para asignar en este proyecto');
        }

      } catch (error) {
        console.error('Error generando previsualización:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
        alert(`Error generando previsualización: ${errorMsg}`);
      } finally {
        this.isLoadingPreview = false;
      }
    },

    // Volver a la selección de tipo
    backToSelection() {
      this.previewData = null;
      this.selectedAssignmentType = null;
    },

    // Confirmar y guardar asignaciones
    async confirmAssignment() {
      if (!this.previewData || !this.selectedAssignmentType || !this.selectedProject) {
        return;
      }

      this.isConfirming = true;

      try {
        let confirmResult;

        if (this.selectedAssignmentType === 'availability') {
          confirmResult = await AssignmentService.confirmBasicAssignment(
            this.selectedProject,
            this.previewData.asignaciones,
            this.previewData.costoTotalProyecto
          );
        } else if (this.selectedAssignmentType === 'cost') {
          confirmResult = await AssignmentService.confirmCostAssignment(
            this.selectedProject,
            this.previewData.asignaciones,
            this.previewData.costoTotalProyecto
          );
        } else if (this.selectedAssignmentType === 'time') {
          confirmResult = await AssignmentService.confirmTimeAssignment(
            this.selectedProject,
            this.previewData.sugerencias || this.previewData.asignaciones
          );
        } else if (this.selectedAssignmentType === 'quality') {
          confirmResult = await AssignmentService.confirmQualityAssignment(
            this.selectedProject,
            this.previewData.sugerencias || this.previewData.asignaciones
          );
        }

        // Mostrar mensaje de éxito
        alert(`✅ ${confirmResult.message}\n\nAsignaciones guardadas correctamente.`);

        // Guardar resultados para mostrar en el resumen
        // Las respuestas de tiempo y calidad pueden tener estructura diferente
        const asignacionesToMap = this.previewData.sugerencias || this.previewData.asignaciones || [];
        this.assignmentResults = asignacionesToMap.map(asig => ({
          tarea: asig.tarea?.descripcion || asig.tarea || asig.descripcion,
          asignado: asig.desarrollador ? `${asig.desarrollador.nombre} ${asig.desarrollador.apellido}` : null,
          motivo: asig.motivo || null,
          horasAsignadasTotales: asig.horasTotales || asig.horasAsignadas || 0,
          dias: asig.dias || []
        }));

        // Guardar en localStorage
        const assignmentData = {
          message: confirmResult.message,
          resumen: this.assignmentResults,
          fechaGeneracion: new Date().toISOString(),
          tipo: this.selectedAssignmentType
        };
        localStorage.setItem('lastAssignmentData', JSON.stringify(assignmentData));

        // Recargar tareas
        await this.loadTasks();

        // Cerrar modal
        this.closeAssignmentTypeModal();

      } catch (error) {
        console.error('Error confirmando asignación:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
        alert(`Error confirmando asignación: ${errorMsg}`);
      } finally {
        this.isConfirming = false;
      }
    },

    async runAvailabilityBasedAssignment() {
      this.assignmentResults = [];
      
      try {
        // Determinar qué proyecto procesar
        let projectsToProcess = [];
        
        if (this.selectedProject) {
          const selectedProj = this.projects.find(p => p._id === this.selectedProject);
          if (selectedProj) {
            projectsToProcess = [selectedProj];
          }
        } else {
          projectsToProcess = this.projects;
        }
        
        // Ejecutar asignación para los proyectos determinados
        for (const project of projectsToProcess) {
          try {
            const resultado = await AssignmentService.runAvailabilityBasedAssignment(project._id);
            
            // Agregar resultados del proyecto
            if (resultado.resumen && resultado.resumen.length > 0) {
              this.assignmentResults.push(...resultado.resumen);
            }
          } catch (error) {
            console.error('Error en asignación por disponibilidad para proyecto', project.name, ':', error);
          }
        }

        // Guardar los datos de asignación en localStorage
        const assignmentData = {
          message: "Asignación automática por disponibilidad y habilidades completada",
          resumen: this.assignmentResults,
          fechaGeneracion: new Date().toISOString(),
          tipo: 'availability'
        };
        localStorage.setItem('lastAssignmentData', JSON.stringify(assignmentData));
        
        // Recargar las tareas para mostrar los cambios
        await this.loadTasks();
        
      } catch (error) {
        console.error('Error ejecutando asignación por disponibilidad:', error);
        throw error;
      }
    },

    async runCostBasedAssignment() {
      this.assignmentResults = [];
      
      try {
        // Determinar qué proyecto procesar
        let projectsToProcess = [];
        
        if (this.selectedProject) {
          const selectedProj = this.projects.find(p => p._id === this.selectedProject);
          if (selectedProj) {
            projectsToProcess = [selectedProj];
          }
        } else {
          projectsToProcess = this.projects;
        }
        
        // Ejecutar asignación para los proyectos determinados
        for (const project of projectsToProcess) {
          try {
            const resultado = await AssignmentService.runCostBasedAssignment(project._id);
            
            // Agregar resultados del proyecto
            if (resultado.resumen && resultado.resumen.length > 0) {
              this.assignmentResults.push(...resultado.resumen);
            }
          } catch (error) {
            console.error('Error en asignación por costo para proyecto', project.name, ':', error);
          }
        }

        // Guardar los datos de asignación en localStorage
        const assignmentData = {
          message: "Asignación automática por costo completada",
          resumen: this.assignmentResults,
          fechaGeneracion: new Date().toISOString(),
          tipo: 'cost'
        };
        localStorage.setItem('lastAssignmentData', JSON.stringify(assignmentData));
        
        // Recargar las tareas para mostrar los cambios
        await this.loadTasks();
        
      } catch (error) {
        console.error('Error ejecutando asignación por costo:', error);
        throw error;
      }
    },

    viewDetailedSummary() {
      // Navegar a la vista de resumen detallado
      this.$router.push('/asignacion-resumen');
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

/* Estilos para asignación automática */
.assignment-item {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  border-left: 4px solid #28a745;
  transition: all 0.3s ease;
}

.assignment-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.assignment-info strong {
  color: #495057;
  font-size: 1.1rem;
  line-height: 1.4;
}

.assignment-info .text-success {
  color: #198754 !important;
  font-weight: 500;
}

.assignment-info .text-warning {
  color: #fd7e14 !important;
  font-weight: 500;
}

.assignment-info .text-muted {
  color: #6c757d !important;
}

.assignment-info .text-info {
  color: #0dcaf0 !important;
}

.assignment-status .badge {
  font-size: 0.9rem;
  padding: 0.5em 0.75em;
}

.assignment-info small {
  font-size: 0.8rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Estilos para el modal de selección de tipo de asignación */
.assignment-option-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e9ecef;
}

.assignment-option-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transform: translateY(-2px);
}

.assignment-option-card.selected {
  border-color: #198754;
  background-color: #f8fff9;
  box-shadow: 0 0.125rem 0.25rem rgba(25, 135, 84, 0.15);
}

.assignment-icon {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.assignment-option-card:hover .assignment-icon {
  opacity: 1;
}

.assignment-option-card.selected .assignment-icon {
  opacity: 1;
}

.assignment-features {
  margin-top: 1rem;
  text-align: left;
}

.assignment-features small {
  display: block;
  margin-bottom: 0.25rem;
}
</style>
