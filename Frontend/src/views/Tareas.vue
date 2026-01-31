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
          <option value="pausada">Pausada</option>
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
                    <button 
                      v-if="task.estado === 'pendiente'"
                      class="btn btn-sm btn-success" 
                      @click="iniciarTarea(task)" 
                      title="Iniciar tarea"
                    >
                      <i class="bi bi-play-fill"></i> Iniciar
                    </button>
                    <button 
                      v-if="task.estado === 'en curso'"
                      class="btn btn-sm btn-warning" 
                      @click="pausarOCompletarTarea(task)" 
                      title="Pausar o completar tarea"
                    >
                      <i class="bi bi-pause-fill"></i> Pausar/Completar
                    </button>
                    <button 
                      v-if="task.estado === 'pausada'"
                      class="btn btn-sm btn-success" 
                      @click="iniciarTarea(task)" 
                      title="Reanudar tarea"
                    >
                      <i class="bi bi-play-fill"></i> Reanudar
                    </button>
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

              <!-- Categoría -->
              <div class="mb-3">
                <label for="taskCategory" class="form-label">Categoría *</label>
                <select class="form-select" id="taskCategory" v-model="taskForm.categoria" required>
                  <option value="">Seleccionar categoría</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="testing">Testing</option>
                  <option value="documentacion">Documentación</option>
                  <option value="machine learning">Machine Learning</option>
                </select>
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
                    <option value="pausada">Pausada</option>
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
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="viewTaskModalLabel">
              <i class="bi bi-info-circle me-2"></i>Detalles Completos de la Tarea
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeViewModal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedTask">
            <!-- Información Principal -->
            <div class="row mb-4">
              <div class="col-md-8">
                <h5 class="mb-3">
                  <i class="bi bi-file-text me-2"></i>{{ selectedTask.descripcion }}
                </h5>
                
                <div class="mb-3">
                  <h6><i class="bi bi-tags me-2"></i>Habilidades Requeridas</h6>
                  <div v-if="selectedTask.habilidadesRequeridas && selectedTask.habilidadesRequeridas.length > 0">
                    <span 
                      v-for="skill in selectedTask.habilidadesRequeridas" 
                      :key="skill" 
                      class="badge bg-primary me-1 mb-1"
                    >
                      {{ skill }}
                    </span>
                  </div>
                  <p v-else class="text-muted mb-0">No especificadas</p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-info-circle me-2"></i>Estado y Prioridad</h6>
                    <div class="mb-2">
                      <strong>Estado:</strong><br>
                      <span class="badge fs-6" :class="getStatusClass(selectedTask.estado)">
                        {{ getStatusText(selectedTask.estado) }}
                      </span>
                    </div>
                    <div class="mb-2">
                      <strong>Prioridad:</strong><br>
                      <span class="badge fs-6" :class="getPriorityClass(selectedTask.prioridad)">
                        {{ getPriorityText(selectedTask.prioridad) }}
                      </span>
                    </div>
                    <div class="mb-2">
                      <strong>Dificultad:</strong><br>
                      <span class="badge bg-info fs-6">{{ selectedTask.nivelDificultad }}/5</span>
                    </div>
                    <div v-if="selectedTask.categoria">
                      <strong>Categoría:</strong><br>
                      <span class="badge bg-secondary fs-6">{{ selectedTask.categoria }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del Proyecto y Asignación -->
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-folder me-2"></i>Proyecto</h6>
                    <p class="mb-0">
                      <strong>{{ getProjectName(selectedTask.proyecto) }}</strong>
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-person me-2"></i>Asignación</h6>
                    <p class="mb-0">
                      <span v-if="selectedTask.desarrolladorAsignado">
                        <strong>{{ getDeveloperName(selectedTask.desarrolladorAsignado) }}</strong>
                        <span v-if="selectedTask.desarrolladorAsignado.email" class="text-muted d-block small">
                          {{ selectedTask.desarrolladorAsignado.email }}
                        </span>
                      </span>
                      <span v-else class="text-muted">Sin asignar</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tiempos y Fechas -->
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-clock me-2"></i>Tiempos</h6>
                    <div class="mb-2">
                      <strong>Tiempo Estimado:</strong>
                      <span class="ms-2">{{ selectedTask.tiempoEstimadoHoras || 'No especificado' }} horas</span>
                    </div>
                    <div class="mb-2">
                      <strong>Tiempo Invertido:</strong>
                      <span class="ms-2">{{ selectedTask.tiempoInvertidoHoras || 0 }} horas</span>
                    </div>
                    <div v-if="selectedTask.tiempoEstimadoHoras && selectedTask.tiempoInvertidoHoras">
                      <strong>Progreso:</strong>
                      <div class="progress mt-2" style="height: 20px;">
                        <div 
                          class="progress-bar" 
                          :class="getProgressClass(selectedTask.tiempoInvertidoHoras, selectedTask.tiempoEstimadoHoras)"
                          role="progressbar" 
                          :style="{ width: getProgressPercentage(selectedTask.tiempoInvertidoHoras, selectedTask.tiempoEstimadoHoras) + '%' }"
                        >
                          {{ getProgressPercentage(selectedTask.tiempoInvertidoHoras, selectedTask.tiempoEstimadoHoras) }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-calendar me-2"></i>Fechas</h6>
                    <div class="mb-2" v-if="selectedTask.fechaEstimadaInicio">
                      <strong>Inicio Estimado:</strong>
                      <span class="ms-2">{{ formatDate(selectedTask.fechaEstimadaInicio) }}</span>
                    </div>
                    <div class="mb-2" v-if="selectedTask.fechaEstimadaFin">
                      <strong>Fin Estimado:</strong>
                      <span class="ms-2">{{ formatDate(selectedTask.fechaEstimadaFin) }}</span>
                    </div>
                    <div class="mb-2" v-if="selectedTask.fechaRealInicio">
                      <strong>Inicio Real:</strong>
                      <span class="ms-2 text-success">{{ formatDate(selectedTask.fechaRealInicio) }}</span>
                    </div>
                    <div class="mb-2" v-if="selectedTask.fechaRealFin">
                      <strong>Fin Real:</strong>
                      <span class="ms-2 text-success">{{ formatDate(selectedTask.fechaRealFin) }}</span>
                    </div>
                    <div class="mb-2" v-if="selectedTask.fechaCreacion">
                      <strong>Creada:</strong>
                      <span class="ms-2 text-muted small">{{ formatDate(selectedTask.fechaCreacion) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Historial de Cambios -->
            <div class="row mb-4" v-if="selectedTask.historial && selectedTask.historial.length > 0">
              <div class="col-12">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-clock-history me-2"></i>Historial de Cambios</h6>
                    <div class="table-responsive">
                      <table class="table table-sm table-hover">
                        <thead>
                          <tr>
                            <th>Campo</th>
                            <th>Valor Anterior</th>
                            <th>Valor Nuevo</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(entry, index) in selectedTask.historial" :key="index">
                            <td>{{ entry.campo }}</td>
                            <td>{{ entry.valorAnterior }}</td>
                            <td>{{ entry.valorNuevo }}</td>
                            <td>{{ formatDate(entry.fechaCambio) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comentarios -->
            <div class="row" v-if="selectedTask.comentarios && selectedTask.comentarios.length > 0">
              <div class="col-12">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <h6 class="card-title"><i class="bi bi-chat-dots me-2"></i>Comentarios</h6>
                    <div v-for="(comentario, index) in selectedTask.comentarios" :key="index" class="mb-3 pb-3 border-bottom">
                      <div class="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{{ getDeveloperName(comentario.usuario) }}</strong>
                          <span class="text-muted small ms-2">{{ formatDate(comentario.fecha) }}</span>
                        </div>
                      </div>
                      <p class="mb-0 mt-1">{{ comentario.mensaje }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeViewModal">
              <i class="bi bi-x-circle me-1"></i>Cerrar
            </button>
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
            <!-- Paso 0: Vista de candidatos y asignación manual -->
            <div v-if="showCandidatesView">
              <div v-if="isLoadingCandidates" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3">Cargando candidatos disponibles...</p>
              </div>
              
              <div v-else-if="candidatesData">
                <h6 class="mb-3">
                  <i class="bi bi-people me-2"></i>
                  Candidatos Disponibles por Tarea
                </h6>
                <p class="text-muted small mb-4">
                  Revisa los candidatos disponibles para cada tarea. Las tareas sin candidatos pueden ser asignadas manualmente.
                </p>
                
                <div class="candidates-list">
                  <div 
                    v-for="(data, tareaId) in candidatesData" 
                    :key="tareaId"
                    class="card mb-3"
                    :class="{ 'border-warning': data.sinCandidatos, 'border-success': !data.sinCandidatos }"
                  >
                    <div class="card-header" :class="{ 'bg-warning text-dark': data.sinCandidatos, 'bg-success text-white': !data.sinCandidatos }">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{{ data.tarea.descripcion || data.tarea.nombre || 'Tarea sin nombre' }}</strong>
                          <span v-if="data.sinCandidatos" class="badge bg-danger ms-2">
                            <i class="bi bi-exclamation-triangle me-1"></i>
                            Sin candidatos automáticos
                          </span>
                          <span v-else class="badge bg-light text-dark ms-2">
                            {{ data.desarrolladoresCandidatos.length }} candidato(s)
                          </span>
                        </div>
                        <div v-if="data.asignacionManual" class="badge bg-info">
                          <i class="bi bi-person-check me-1"></i>
                          Asignado manualmente: {{ data.asignacionManual.desarrollador.nombre }} {{ data.asignacionManual.desarrollador.apellido }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="card-body">
                      <div v-if="data.desarrolladoresCandidatos && data.desarrolladoresCandidatos.length > 0">
                        <h6 class="mb-2">Candidatos disponibles:</h6>
                        <div class="table-responsive">
                          <table class="table table-sm table-hover">
                            <thead>
                              <tr>
                                <th>Desarrollador</th>
                                <th>Habilidades</th>
                                <th>Experiencia</th>
                                <th>Costo/hora</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="candidato in data.desarrolladoresCandidatos" :key="candidato.id">
                                <td>
                                  <strong>{{ candidato.nombre }} {{ candidato.apellido }}</strong>
                                </td>
                                <td>
                                  <span 
                                    v-for="(habilidad, idx) in candidato.habilidades.slice(0, 3)" 
                                    :key="idx"
                                    class="badge bg-secondary me-1"
                                  >
                                    {{ typeof habilidad === 'string' ? habilidad : habilidad.nombre }}
                                  </span>
                                  <span v-if="candidato.habilidades.length > 3" class="text-muted">
                                    +{{ candidato.habilidades.length - 3 }} más
                                  </span>
                                </td>
                                <td>{{ candidato.aniosExperiencia || 0 }} años</td>
                                <td>${{ candidato.costoPorHora || 0 }}/h</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div v-if="data.sinCandidatos && !data.asignacionManual" class="mt-3">
                        <div class="alert alert-warning mb-3">
                          <i class="bi bi-exclamation-triangle me-2"></i>
                          <strong>Esta tarea no tiene candidatos automáticos.</strong>
                          <p class="mb-0 mt-2 small">
                            Puedes asignar manualmente un desarrollador que tenga las habilidades requeridas.
                          </p>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label">Seleccionar Desarrollador:</label>
                          <select 
                            class="form-select" 
                            :data-tarea-id="tareaId"
                            :value="manualAssignments[tareaId]?.desarrolladorId || ''"
                            @change="assignDeveloperManually(tareaId, $event.target.value)"
                          >
                            <option value="">Seleccionar desarrollador...</option>
                            <!-- Para asignación manual: mostrar solo desarrolladores que aparecen en asignaciones de "basica" -->
                            <option 
                              v-for="dev in developersFromBasica" 
                              :key="dev._id"
                              :value="dev._id"
                            >
                              {{ dev.nombre }} {{ dev.apellido }}
                              ({{ dev.aniosExperiencia || 0 }} años exp.)
                            </option>
                            <option v-if="developersFromBasica.length === 0" disabled>
                              No hay desarrolladores disponibles para asignación manual
                            </option>
                          </select>
                        </div>
                      </div>
                      
                      <div v-if="data.asignacionManual" class="alert alert-success mt-3">
                        <i class="bi bi-check-circle me-2"></i>
                        <strong>Asignación manual completada:</strong>
                        {{ data.asignacionManual.desarrollador.nombre }} {{ data.asignacionManual.desarrollador.apellido }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No se pudieron cargar los candidatos. Por favor, intenta nuevamente.
              </div>
            </div>

            <!-- Paso 1: Tabla comparativa de criterios -->
            <div v-else-if="showComparisonTable">
              <div v-if="isLoadingComparison" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3">Cargando comparación de criterios...</p>
              </div>
              
              <div v-else-if="comparisonData">
                <h6 class="mb-3">Comparación de Criterios de Optimización</h6>
                <p class="text-muted small mb-4">Compara los resultados de cada criterio de optimización para elegir el más adecuado para tu proyecto.</p>
                
                <div class="table-responsive">
                  <table class="table table-hover table-bordered">
                    <thead class="table-dark">
                      <tr>
                        <th>Criterio de Optimización</th>
                        <th>Costo Total del Proyecto</th>
                        <th>Tiempo Total del Proyecto</th>
                        <th>Calidad</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(data, key) in comparisonData" :key="key">
                        <tr v-if="data">
                          <td>
                            <strong>{{ getCriterioName(key) }}</strong>
                            <span v-if="data && data.isLoading" class="badge bg-info ms-2">
                              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                              Cargando...
                            </span>
                            <span v-else-if="data && data.error" class="badge bg-danger ms-2">Error</span>
                          </td>
                          <td>
                            <span v-if="data && data.isLoading" class="text-muted">
                              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                            </span>
                            <span v-else-if="data && data.error" class="text-danger">-</span>
                            <span v-else-if="data && data.costoTotal !== null && data.costoTotal !== undefined" class="fw-bold text-success">
                              ${{ typeof data.costoTotal === 'number' ? data.costoTotal.toFixed(2) : data.costoTotal }}
                            </span>
                            <span v-else class="text-muted">N/A</span>
                          </td>
                          <td>
                            <span v-if="data && data.isLoading" class="text-muted">
                              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                            </span>
                            <span v-else-if="data && data.error" class="text-danger">-</span>
                            <span v-else-if="data && data.tiempoTotal !== null && data.tiempoTotal !== undefined" class="fw-bold">
                              {{ formatTiempo(data.tiempoTotal) }}
                            </span>
                            <span v-else class="text-muted">N/A</span>
                          </td>
                          <td>
                            <span v-if="data && data.isLoading" class="text-muted">
                              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                            </span>
                            <span v-else-if="data && data.error" class="text-danger">-</span>
                            <span v-else-if="data && data.calidad !== null && data.calidad !== undefined" class="fw-bold">
                              {{ formatCalidad(data.calidad) }}
                            </span>
                            <span v-else class="text-muted">N/A</span>
                          </td>
                          <td>
                            <button 
                              v-if="data && !data.isLoading && !data.error && data.previewData"
                              class="btn btn-sm btn-primary"
                              @click="viewPreviewFromComparison(key)"
                            >
                              <i class="bi bi-eye me-1"></i>
                              Ver Previsualización
                            </button>
                            <span v-else-if="data && data.isLoading" class="text-muted">Cargando...</span>
                            <span v-else class="text-muted">-</span>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div v-else class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No se pudieron cargar los datos comparativos. Por favor, intenta nuevamente.
              </div>
            </div>

            <!-- Paso 2: Selección de tipo (si no hay preview y no se muestra tabla) -->
            <div v-else-if="!previewData && !showComparisonTable">
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

            <!-- Paso 3: Preview de asignaciones (si hay preview y es solo visualización) -->
            <div v-else-if="previewData && previewData.isViewOnly">
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
                      <th>Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(asignacion, index) in previewData.asignaciones" :key="index">
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
                      <td>
                        <span v-if="asignacion.razon" class="small text-muted" :title="asignacion.razon">
                          {{ asignacion.razon.length > 100 ? asignacion.razon.substring(0, 100) + '...' : asignacion.razon }}
                        </span>
                        <span v-else-if="asignacion.motivo" class="small text-warning">
                          {{ asignacion.motivo }}
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Resumen total -->
              <div class="alert alert-success mt-3" v-if="typeof previewData.costoTotalProyecto === 'number'">
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
            </div>

            <!-- Paso 4: Confirmación directa (cuando se selecciona tipo desde los 4 cuadros) -->
            <div v-else-if="previewData && !previewData.isViewOnly">
              <div class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i>
                <strong>Confirmar Asignación</strong>
                <p class="mb-0 mt-2">
                  Has seleccionado la asignación por <strong>{{ getCriterioName(getCriterioKey(selectedAssignmentType)) }}</strong>.
                  Los datos ya fueron comparados en la tabla anterior.
                </p>
              </div>

              <!-- Resumen breve -->
              <div class="row mt-3">
                <div class="col-md-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <h6 class="text-muted mb-2">Costo Total</h6>
                      <h4 class="text-success mb-0" v-if="previewData.costoTotalProyecto">
                        ${{ previewData.costoTotalProyecto.toFixed(2) }}
                      </h4>
                      <span v-else class="text-muted">N/A</span>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <h6 class="text-muted mb-2">Tiempo Total</h6>
                      <h4 class="mb-0" v-if="comparisonData && comparisonData[getCriterioKey(selectedAssignmentType)]?.tiempoTotal">
                        {{ formatTiempo(comparisonData[getCriterioKey(selectedAssignmentType)].tiempoTotal) }}
                      </h4>
                      <span v-else class="text-muted">N/A</span>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-0 bg-light">
                    <div class="card-body text-center">
                      <h6 class="text-muted mb-2">Calidad</h6>
                      <h4 class="mb-0" v-if="comparisonData && comparisonData[getCriterioKey(selectedAssignmentType)]?.calidad">
                        {{ formatCalidad(comparisonData[getCriterioKey(selectedAssignmentType)].calidad) }}
                      </h4>
                      <span v-else class="text-muted">N/A</span>
                    </div>
                  </div>
                </div>
              </div>

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
            <!-- Botones cuando se muestra la vista de candidatos -->
            <template v-if="showCandidatesView">
              <button 
                type="button" 
                class="btn btn-outline-secondary me-2" 
                @click="showCandidatesView = false; showComparisonTable = true;"
              >
                <i class="bi bi-arrow-left me-2"></i>
                Volver a Comparación
              </button>
              <button 
                type="button" 
                class="btn btn-secondary me-2" 
                @click="closeAssignmentTypeModal"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                class="btn btn-primary" 
                @click="proceedToComparisonTable"
                :disabled="isLoadingCandidates || isConfirming"
              >
                <span v-if="isConfirming" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <i v-else class="bi bi-arrow-right me-2"></i>
                {{ isConfirming ? 'Verificando...' : 'Verificar y Aplicar Asignaciones' }}
              </button>
            </template>
            
            <!-- Botones cuando se muestra la tabla comparativa -->
            <template v-else-if="showComparisonTable">
              <button 
                type="button" 
                class="btn btn-primary" 
                @click="showTypeSelection"
              >
                <i class="bi bi-check-circle me-2"></i>
                Elegir Asignación
              </button>
              <button 
                type="button" 
                class="btn btn-secondary" 
                @click="closeAssignmentTypeModal"
              >
                Cerrar
              </button>
            </template>
            
            <!-- Botones cuando se muestra la selección de tipo -->
            <template v-else-if="!previewData && !showComparisonTable">
              <button 
                type="button" 
                class="btn btn-outline-secondary" 
                @click="backToComparisonTable"
              >
                <i class="bi bi-arrow-left me-2"></i>
                Volver a Comparación
              </button>
              <button type="button" class="btn btn-secondary" @click="closeAssignmentTypeModal">
                Cerrar
              </button>
              <button 
                type="button" 
                class="btn btn-primary" 
                @click="generatePreview"
                :disabled="!selectedAssignmentType || isLoadingPreview"
              >
                <span v-if="isLoadingPreview" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <i v-else class="bi bi-eye me-2"></i>
                {{ isLoadingPreview ? 'Generando...' : 'Ver Previsualización' }}
              </button>
            </template>
            
            <!-- Botones cuando hay preview solo visual (desde tabla comparativa) -->
            <template v-else-if="previewData && previewData.isViewOnly">
              <button type="button" class="btn btn-secondary" @click="closeAssignmentTypeModal">
                Cerrar
              </button>
              <button 
                type="button" 
                class="btn btn-outline-primary" 
                @click="backToComparisonTable"
              >
                <i class="bi bi-arrow-left me-2"></i>
                Volver a Comparación
              </button>
            </template>
            
            <!-- Botones cuando hay preview para confirmar (desde selección de tipo) -->
            <template v-else-if="previewData && !previewData.isViewOnly">
              <button 
                type="button" 
                class="btn btn-outline-secondary" 
                @click="backToSelectionType"
              >
                <i class="bi bi-arrow-left me-2"></i>
                Volver a Selección
              </button>
              <button type="button" class="btn btn-secondary" @click="closeAssignmentTypeModal">
                Cerrar
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
        categoria: '',
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
      selectedAssignmentType: null, // 'availability', 'cost', 'time', o 'quality'
      
      // Preview y confirmación
      previewData: null,
      isLoadingPreview: false,
      isConfirming: false,
      
      // Datos comparativos de los 4 criterios
      comparisonData: null,
      isLoadingComparison: false,
      showComparisonTable: true, // true = mostrar tabla comparativa, false = mostrar selección de tipo o preview
      
      // Vista de candidatos y asignación manual
      showCandidatesView: false, // true = mostrar vista de candidatos, false = mostrar tabla comparativa
      candidatesData: null, // Objeto con candidatos por tarea (devsDataPorTarea)
      isLoadingCandidates: false,
      manualAssignments: {}, // Objeto para almacenar asignaciones manuales { tareaId: { desarrolladorId, ... } }
      allDevelopers: [], // Todos los desarrolladores para selección manual
      resumenSimulacion: null // Resumen completo de simulación (basica, costo, tiempoIA, calidad)
    };
  },
  computed: {
    isUserAdmin() {
      return this.user && this.user.rol === 'admin';
    },
    
    // Obtener desarrolladores que aparecen en asignaciones de "basica" para asignación manual
    developersFromBasica() {
      if (!this.resumenSimulacion || !this.resumenSimulacion.basica || !this.resumenSimulacion.basica.asignaciones) {
        return [];
      }
      
      const devIds = new Set();
      this.resumenSimulacion.basica.asignaciones.forEach(asig => {
        if (asig.desarrolladorId) {
          devIds.add(asig.desarrolladorId);
        }
      });
      
      // Devolver los desarrolladores completos que están en el set de IDs
      return this.allDevelopers.filter(dev => devIds.has(dev._id));
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
        categoria: task.categoria || '',
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
        if (!this.taskForm.categoria) {
          throw new Error('Debe seleccionar una categoría');
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
            categoria: this.taskForm.categoria,
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
            categoria: this.taskForm.categoria,
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
        categoria: '',
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
        'pausada': 'bg-info',
        'completada': 'bg-success'
      };
      return classes[status] || 'bg-light';
    },
    
    getStatusText(status) {
      const texts = {
        'pendiente': 'Pendiente',
        'en curso': 'En Curso',
        'pausada': 'Pausada',
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
    
    // Métodos auxiliares para el modal de detalles
    getProgressPercentage(tiempoInvertido, tiempoEstimado) {
      if (!tiempoEstimado || tiempoEstimado === 0) return 0;
      const porcentaje = (tiempoInvertido / tiempoEstimado) * 100;
      return Math.min(Math.round(porcentaje), 100);
    },
    
    getProgressClass(tiempoInvertido, tiempoEstimado) {
      if (!tiempoEstimado || tiempoEstimado === 0) return 'bg-secondary';
      const porcentaje = (tiempoInvertido / tiempoEstimado) * 100;
      if (porcentaje >= 100) return 'bg-danger';
      if (porcentaje >= 75) return 'bg-warning';
      return 'bg-success';
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
    async openAssignmentTypeModal() {
      if (!this.selectedProject) {
        alert('Por favor selecciona un proyecto antes de abrir la asignación automática');
        return;
      }
      
      this.selectedAssignmentType = null;
      this.previewData = null;
      this.isLoadingPreview = false;
      this.isConfirming = false;
      this.comparisonData = null;
      this.showComparisonTable = false; // NO mostrar tabla comparativa por defecto
      this.showCandidatesView = true; // Mostrar vista de candidatos inicialmente
      this.manualAssignments = {}; // Limpiar asignaciones manuales
      this.resumenSimulacion = null; // Limpiar resumen anterior
      this.isLoadingCandidates = true; // Indicar que se está cargando candidatos
      this.assignmentTypeModalInstance.show();
      
      // Cargar resumen de simulación y mostrar vista de candidatos
      await this.loadResumenSimulacion();
    },

    closeAssignmentTypeModal() {
      this.selectedAssignmentType = null;
      this.previewData = null;
      this.isLoadingPreview = false;
      this.isConfirming = false;
      this.comparisonData = null;
      this.showComparisonTable = true;
      this.showCandidatesView = false;
      this.candidatesData = null;
      this.manualAssignments = {};
      this.allDevelopers = [];
      this.assignmentTypeModalInstance.hide();
    },

    selectAssignmentType(type) {
      this.selectedAssignmentType = type;
      // Al seleccionar un tipo, preparar los datos para confirmar directamente
      // usando los datos que ya tenemos de la tabla comparativa
      if (this.comparisonData && this.comparisonData[this.getCriterioKey(type)]) {
        const criterioData = this.comparisonData[this.getCriterioKey(type)];
        if (criterioData.previewData && !criterioData.error) {
          // Usar los datos ya cargados de la comparación
          this.previewData = {
            ...criterioData.previewData,
            isViewOnly: false // Permitir confirmar
          };
          this.showComparisonTable = false; // Ocultar selección de tipo, mostrar confirmación
        }
      }
    },

    // Obtener la clave del criterio en comparisonData
    getCriterioKey(type) {
      const mapping = {
        'availability': 'disponibilidad',
        'cost': 'costo',
        'time': 'tiempo',
        'quality': 'calidad'
      };
      return mapping[type] || type;
    },

    // Mostrar modal de selección de tipo (desde la tabla comparativa)
    showTypeSelection() {
      this.showComparisonTable = false;
      this.previewData = null; // Limpiar preview al volver a selección
      this.selectedAssignmentType = null; // Limpiar selección
    },

    // Cargar datos comparativos de los 4 criterios (secuencialmente para evitar rate limits)
    async loadComparisonData() {
      if (!this.selectedProject) {
        return;
      }

      this.isLoadingComparison = true;
      
      // Inicializar comparisonData con estados de carga
      this.comparisonData = {
        disponibilidad: { isLoading: true, criterio: 'availability' },
        costo: { isLoading: true, criterio: 'cost' },
        tiempo: { isLoading: true, criterio: 'time' },
        calidad: { isLoading: true, criterio: 'quality' }
      };
      
      try {
        // Función para cargar un criterio y actualizar comparisonData
        const loadCriterio = async (serviceMethod, criterioKey, criterioName) => {
          try {
            console.log(`Cargando ${criterioName}...`);
            const data = await serviceMethod(this.selectedProject);
            const extracted = this.extractComparisonData(data, criterioKey);
            // Actualizar solo este criterio en comparisonData
            this.$set(this.comparisonData, criterioKey, extracted);
            console.log(`${criterioName} cargado correctamente`);
            return extracted;
          } catch (err) {
            console.error(`Error cargando ${criterioName}:`, err);
            const errorData = {
              criterio: criterioKey,
              error: err.response?.data?.error || err.message || 'Error desconocido',
              costoTotal: null,
              tiempoTotal: null,
              calidad: null,
              previewData: null,
              isLoading: false
            };
            this.$set(this.comparisonData, criterioKey, errorData);
            return errorData;
          }
        };
        
        // Cargar secuencialmente (uno por uno) para evitar rate limits
        await loadCriterio(AssignmentService.previewBasicAssignment.bind(AssignmentService), 'disponibilidad', 'Disponibilidad');
        await loadCriterio(AssignmentService.previewCostAssignment.bind(AssignmentService), 'costo', 'Costo');
        await loadCriterio(AssignmentService.previewTimeAssignment.bind(AssignmentService), 'tiempo', 'Tiempo');
        await loadCriterio(AssignmentService.previewQualityAssignment.bind(AssignmentService), 'calidad', 'Calidad');
        
      } catch (error) {
        console.error('Error cargando datos comparativos:', error);
        alert('Error al cargar los datos comparativos. Por favor, intenta nuevamente.');
      } finally {
        this.isLoadingComparison = false;
      }
    },
    
    // Extraer datos de un criterio (extraído como método separado para reutilizar)
    extractComparisonData(data, criterio) {
      try {
        if (!data) {
          return {
            criterio,
            error: 'No se recibieron datos',
            costoTotal: null,
            tiempoTotal: null,
            calidad: null,
            previewData: null,
            isLoading: false
          };
        }

        if (data.error) {
          return {
            criterio,
            error: data.error,
            costoTotal: null,
            tiempoTotal: null,
            calidad: null,
            previewData: null,
            isLoading: false
          };
        }

        const asignaciones = Array.isArray(data.asignaciones)
          ? data.asignaciones
          : Array.isArray(data.sugerencias?.asignaciones)
            ? data.sugerencias.asignaciones
            : [];

        const costoTotal = typeof data.costoTotalProyecto === 'number'
          ? data.costoTotalProyecto
          : typeof data.sugerencias?.costoTotalProyecto === 'number'
            ? data.sugerencias.costoTotalProyecto
            : null;

        const tiempoTotal = typeof data.tiempoTotalEstimadoRealProyecto === 'number'
          ? data.tiempoTotalEstimadoRealProyecto
          : typeof data.sugerencias?.tiempoTotalEstimadoRealProyecto === 'number'
            ? data.sugerencias.tiempoTotalEstimadoRealProyecto
            : null;

        const calidad = typeof data.calidadPromedioProyecto === 'number'
          ? data.calidadPromedioProyecto
          : typeof data.sugerencias?.calidadPromedioProyecto === 'number'
            ? data.sugerencias.calidadPromedioProyecto
            : typeof data.calidadPromedioTareas === 'number'
              ? data.calidadPromedioTareas
              : typeof data.sugerencias?.calidadPromedioTareas === 'number'
                ? data.sugerencias.calidadPromedioTareas
                : null;

        // Guardar los datos completos para la previsualización
        let confirmPayload = null;
        if (criterio === 'time' || criterio === 'quality') {
          confirmPayload = {
            success: data.success !== undefined ? data.success : true,
            criterio: criterio === 'time' ? 'tiempo' : 'calidad',
            sugerencias: data.sugerencias || {
              asignaciones,
              costoTotalProyecto: costoTotal
            }
          };
        }

        return {
          criterio,
          costoTotal,
          tiempoTotal,
          calidad,
          isLoading: false,
          previewData: {
            ...data,
            asignaciones,
            costoTotalProyecto: costoTotal,
            confirmPayload
          }
        };
      } catch (error) {
        console.error(`Error extrayendo datos para criterio ${criterio}:`, error);
        return {
          criterio,
          error: error.message || 'Error al procesar datos',
          costoTotal: null,
          tiempoTotal: null,
          calidad: null,
          previewData: null,
          isLoading: false
        };
      }
    },

    // Ver previsualización de un criterio específico desde la tabla (solo visual, sin confirmar)
    viewPreviewFromComparison(criterio) {
      if (!this.comparisonData || !this.comparisonData[criterio]) {
        alert('No hay datos disponibles para este criterio');
        return;
      }

      const criterioData = this.comparisonData[criterio];
      
      if (criterioData.error) {
        alert(`Error al cargar datos de ${this.getCriterioName(criterio)}: ${criterioData.error}`);
        return;
      }

      if (!criterioData.previewData) {
        alert('No hay datos de previsualización disponibles para este criterio');
        return;
      }

      // Establecer el tipo de asignación seleccionado
      this.selectedAssignmentType = criterioData.criterio;
      
      // Establecer los datos de preview con flag de solo visualización
      const defaultMessages = {
        availability: 'Previsualización generada correctamente.',
        cost: 'Previsualización por costo generada correctamente.',
        time: 'Previsualización de IA por tiempo generada correctamente.',
        quality: 'Previsualización de IA por calidad generada correctamente.'
      };

      this.previewData = {
        ...criterioData.previewData,
        message: criterioData.previewData.message || defaultMessages[criterioData.criterio] || 'Previsualización generada.',
        isViewOnly: true // Flag para indicar que es solo visualización desde la tabla
      };

      // Ocultar la tabla comparativa y mostrar la previsualización
      this.showComparisonTable = false;
    },

    // Obtener nombre legible del criterio
    getCriterioName(criterio) {
      const names = {
        disponibilidad: 'Disponibilidad',
        costo: 'Costo',
        tiempo: 'Tiempo',
        calidad: 'Calidad'
      };
      return names[criterio] || criterio;
    },

    // Formatear calidad (estrellas)
    formatCalidad(calidad) {
      if (calidad === null || calidad === undefined) return 'N/A';
      const estrellas = Math.round(calidad);
      return '★'.repeat(estrellas) + '☆'.repeat(5 - estrellas) + ` (${calidad.toFixed(1)})`;
    },

    // Formatear tiempo (horas a días si es necesario)
    formatTiempo(horas) {
      if (horas === null || horas === undefined) return 'N/A';
      if (horas >= 24) {
        const dias = Math.floor(horas / 24);
        const horasRestantes = Math.round(horas % 24);
        if (horasRestantes > 0) {
          return `${dias}d ${horasRestantes}h`;
        }
        return `${dias}d`;
      }
      return `${Math.round(horas)}h`;
    },
    
    // Cargar resumen de simulación y extraer candidatos de la parte "basica"
    async loadResumenSimulacion() {
      if (!this.selectedProject) {
        return;
      }
      
      this.isLoadingCandidates = true;
      
      try {
        // 1. Obtener resumen completo de simulación
        const resumen = await AssignmentService.getResumenSimulacion(this.selectedProject);
        console.log('📊 Resumen de simulación recibido:', resumen);
        
        // Guardar el resumen completo para usarlo después
        this.resumenSimulacion = resumen;
        
        // 2. Obtener todos los desarrolladores para asignación manual
        const usersResponse = await UserService.getUsers();
        const desarrolladores = usersResponse.data.filter(user => user.rol === 'user');
        
        if (desarrolladores.length === 0) {
          alert('No hay desarrolladores disponibles.');
          this.closeAssignmentTypeModal();
          return;
        }
        
        this.allDevelopers = desarrolladores;
        
        // 3. Extraer candidatos solo de la parte "basica" del resumen
        const asignacionesBasica = resumen.basica?.asignaciones || [];
        
        if (asignacionesBasica.length === 0) {
          alert('No se encontraron asignaciones en el resumen básico.');
          this.closeAssignmentTypeModal();
          return;
        }
        
        // 4. Construir candidatesData usando los datos del resumen básico
        const devsDataPorTarea = {};
        
        // Crear un mapa de desarrolladores por ID para acceso rápido
        const devsMap = new Map();
        desarrolladores.forEach(dev => {
          devsMap.set(dev._id, dev);
        });
        
        // Construir estructura de candidatos por tarea
        for (const asignacion of asignacionesBasica) {
          const tareaId = asignacion.tareaId;
          
          // Si la tarea tiene sinCandidatos: true, marcar como sin candidatos
          if (asignacion.sinCandidatos) {
            devsDataPorTarea[tareaId] = {
              tarea: {
                id: tareaId,
                descripcion: asignacion.descripcion || 'Sin descripción',
                fechaEstimadaInicio: asignacion.fechaEstimadaInicio,
                fechaEstimadaFin: asignacion.fechaEstimadaFin,
                habilidadesRequeridas: asignacion.habilidadesRequeridas || [],
                prioridad: asignacion.prioridad || 'media',
                estimacionHoras: asignacion.estimacionHoras || asignacion.horasTotales || 0
              },
              desarrolladoresCandidatos: [], // Vacío porque sinCandidatos: true
              sinCandidatos: true
            };
          } else if (asignacion.desarrolladorId) {
            // Si tiene desarrollador asignado, mostrar ese desarrollador como candidato
            const dev = devsMap.get(asignacion.desarrolladorId);
            const candidatoInfo = dev ? {
              id: dev._id,
              nombre: dev.nombre || asignacion.nombre || '',
              apellido: dev.apellido || asignacion.apellido || '',
              aniosExperiencia: dev.aniosExperiencia || 0,
              habilidades: dev.habilidades?.map(h => ({
                nombre: typeof h === 'string' ? h : h.nombre,
                nivel: typeof h === 'string' ? null : h.nivel
              })) || [],
              costoPorHora: dev.costoPorHora || 0,
              rendimientoHistorico: asignacion.rendimientoHistorico || dev.rendimientoHistorico || null,
              puntuacionPromedioCalidad: dev.puntuacionPromedioCalidad || null,
              feedbackHistorico: asignacion.feedbackHistorico || dev.feedbackHistorico || null
            } : {
              id: asignacion.desarrolladorId,
              nombre: asignacion.nombre || '',
              apellido: asignacion.apellido || '',
              aniosExperiencia: 0,
              habilidades: [],
              costoPorHora: 0
            };
            
            devsDataPorTarea[tareaId] = {
              tarea: {
                id: tareaId,
                descripcion: asignacion.descripcion || 'Sin descripción',
                fechaEstimadaInicio: asignacion.dias?.[0]?.fecha || asignacion.fechaEstimadaInicio,
                fechaEstimadaFin: asignacion.fechaEstimadaFin,
                habilidadesRequeridas: asignacion.habilidadesRequeridas || [],
                prioridad: asignacion.prioridad || 'media',
                estimacionHoras: asignacion.horasTotales || asignacion.estimacionHoras || 0
              },
              desarrolladoresCandidatos: [candidatoInfo],
              sinCandidatos: false
            };
          } else {
            // Tarea sin asignar pero no marcada como sinCandidatos (caso inusual)
            devsDataPorTarea[tareaId] = {
              tarea: {
                id: tareaId,
                descripcion: asignacion.descripcion || 'Sin descripción',
                fechaEstimadaInicio: asignacion.fechaEstimadaInicio,
                fechaEstimadaFin: asignacion.fechaEstimadaFin,
                habilidadesRequeridas: asignacion.habilidadesRequeridas || [],
                prioridad: asignacion.prioridad || 'media',
                estimacionHoras: asignacion.horasTotales || asignacion.estimacionHoras || 0
              },
              desarrolladoresCandidatos: [],
              sinCandidatos: true
            };
          }
        }
        
        this.candidatesData = devsDataPorTarea;
        
        console.log('✅ CandidatesData construido:', this.candidatesData);
        
        // 5. Construir comparisonData desde el resumen completo para mostrar tabla comparativa
        this.comparisonData = {};
        
        // Procesar cada criterio del resumen
        // Mapear claves del resumen a claves de comparisonData
        const criterios = [
          { resumenKey: 'basica', comparacionKey: 'disponibilidad', name: 'Disponibilidad' },
          { resumenKey: 'costo', comparacionKey: 'costo', name: 'Costo' },
          { resumenKey: 'tiempo', comparacionKey: 'tiempo', name: 'Tiempo' },
          { resumenKey: 'calidad', comparacionKey: 'calidad', name: 'Calidad' }
        ];
        
        criterios.forEach(({ resumenKey, comparacionKey, name }) => {
          const criterioData = resumen[resumenKey];
          if (!criterioData || !criterioData.asignaciones) {
            this.comparisonData[comparacionKey] = {
              criterio: comparacionKey,
              error: `No hay datos disponibles para ${name}`,
              costoTotal: null,
              tiempoTotal: null,
              calidad: null,
              previewData: null,
              isLoading: false
            };
            return;
          }
          
          const asignaciones = criterioData.asignaciones || [];
          
          // Calcular costo total desde las asignaciones
          let costoTotal = asignaciones.reduce((sum, a) => {
            const costo = typeof a.costoTotal === 'number' ? a.costoTotal : Number(a.costoTotal) || 0;
            return sum + costo;
          }, 0);
          
          // Calcular tiempo total desde las asignaciones
          let tiempoTotal = asignaciones.reduce((sum, a) => {
            // Usar horasEstimadasSegunRendimiento si existe, sino horasTotales
            const horas = a.horasEstimadasSegunRendimiento != null 
              ? (typeof a.horasEstimadasSegunRendimiento === 'number' ? a.horasEstimadasSegunRendimiento : Number(a.horasEstimadasSegunRendimiento) || 0)
              : (a.horasTotales != null ? (typeof a.horasTotales === 'number' ? a.horasTotales : Number(a.horasTotales) || 0) : 0);
            return sum + horas;
          }, 0);
          
          // Calcular calidad promedio desde las asignaciones
          let calidad = null;
          const calidadesValidas = asignaciones
            .map(a => {
              const cal = a.calidadTarea != null 
                ? (typeof a.calidadTarea === 'number' ? a.calidadTarea : Number(a.calidadTarea))
                : null;
              return isNaN(cal) ? null : cal;
            })
            .filter(cal => cal != null && cal > 0);
          
          if (calidadesValidas.length > 0) {
            calidad = calidadesValidas.reduce((sum, cal) => sum + cal, 0) / calidadesValidas.length;
            calidad = Number(calidad.toFixed(2));
          }
          
          // Si no hay calidad calculada, intentar usar feedbackHistorico
          if (calidad == null) {
            const feedbacksValidos = asignaciones
              .map(a => {
                const fb = a.feedbackHistorico != null 
                  ? (typeof a.feedbackHistorico === 'number' ? a.feedbackHistorico : Number(a.feedbackHistorico))
                  : null;
                return isNaN(fb) || fb === 0 ? null : fb;
              })
              .filter(fb => fb != null && fb > 0);
            
            if (feedbacksValidos.length > 0) {
              calidad = feedbacksValidos.reduce((sum, fb) => sum + fb, 0) / feedbacksValidos.length;
              calidad = Number(calidad.toFixed(2));
            }
          }
          
          // Guardar las asignaciones completas tal como vienen del resumen
          // Esto incluye todos los campos: descripcion, desarrolladorId, nombre, apellido, dias, horasTotales, razon, etc.
          console.log(`📋 Guardando asignaciones para ${comparacionKey}:`, asignaciones);
          
          this.comparisonData[comparacionKey] = {
            criterio: comparacionKey,
            costoTotal: costoTotal > 0 ? costoTotal : null,
            tiempoTotal: tiempoTotal > 0 ? tiempoTotal : null,
            calidad: calidad,
            isLoading: false,
            previewData: {
              asignaciones: asignaciones, // Array completo de asignaciones con todos sus campos del resumen
              costoTotalProyecto: costoTotal > 0 ? costoTotal : null,
              projectId: criterioData.projectId || null
            }
          };
        });
        
        console.log('✅ ComparisonData construido desde resumen:', this.comparisonData);
        console.log('✅ Asignaciones en disponibilidad:', this.comparisonData?.disponibilidad?.previewData?.asignaciones);
        
        // 6. Mostrar automáticamente la tabla comparativa en lugar de la vista de candidatos
        this.showCandidatesView = false;
        this.showComparisonTable = true;
        
      } catch (error) {
        console.error('Error cargando resumen de simulación:', error);
        alert('Error al cargar el resumen de simulación. Por favor, intenta nuevamente.');
        this.closeAssignmentTypeModal();
      } finally {
        this.isLoadingCandidates = false;
        this.isLoadingComparison = false;
      }
    },
    
    // Construir lista de candidatos con disponibilidad
    async buildCandidatesList(candidatosPorHabilidad, tarea) {
      return Promise.all(
        candidatosPorHabilidad.map(async (dev) => {
          // Obtener disponibilidad detallada
          let diasDisponibles = [];
          try {
            const availabilityValidation = await ValidationService.validateDeveloperAvailability(
              dev._id,
              tarea.fechaEstimadaInicio,
              tarea.fechaEstimadaFin,
              tarea.tiempoEstimadoHoras
            );
            
            // Si hay datos de disponibilidad, usarlos
            if (availabilityValidation.availableHours) {
              // Construir días disponibles desde availableHours si está disponible
              // Por ahora, solo incluimos la información básica
            }
          } catch (error) {
            console.warn(`Error obteniendo disponibilidad para dev ${dev._id}:`, error);
          }
          
          return {
            id: dev._id,
            nombre: dev.nombre,
            apellido: dev.apellido,
            aniosExperiencia: dev.aniosExperiencia || 0,
            habilidades: dev.habilidades?.map(h => ({
              nombre: typeof h === 'string' ? h : h.nombre,
              nivel: typeof h === 'string' ? null : h.nivel
            })) || [],
            preferenciasHabilidad: dev.preferenciasHabilidad || [],
            costoPorHora: dev.costoPorHora || 0,
            rendimientoHistorico: dev.rendimientoHistorico || null,
            puntuacionPromedioCalidad: dev.puntuacionPromedioCalidad || null,
            feedbackHistorico: dev.feedbackHistorico || null,
            disponibilidad: {
              diasDisponibles
            }
          };
        })
      );
    },
    
    // Verificar si un desarrollador tiene habilidades suficientes (50% mínimo)
    // Esta función debe coincidir exactamente con el backend: filtroHabilidades.js
    tieneHabilidadesSuficientes(dev, habilidadesRequeridas, umbral = 0.5) {
      if (!habilidadesRequeridas || habilidadesRequeridas.length === 0) {
        return true; // Si no hay habilidades requeridas, todos pasan
      }

      if (!dev.habilidades || dev.habilidades.length === 0) {
        return false; // Si el dev no tiene habilidades, no pasa
      }

      // Normalizar nombres: todo a minúsculas y quitar espacios iniciales/finales (igual que backend)
      const habDev = dev.habilidades.map(h => {
        const nombre = typeof h === 'string' ? h : (h.nombre || '');
        return nombre.trim().toLowerCase();
      }).filter(h => h);

      const habReq = habilidadesRequeridas.map(h => {
        const nombre = typeof h === 'string' ? h : (h.nombre || h);
        return nombre.trim().toLowerCase();
      }).filter(h => h);

      // Contar cuántas habilidades requeridas tiene el dev (comparación exacta como backend)
      const cantidadCumplida = habReq.filter(h => habDev.includes(h)).length;

      // Verificar porcentaje mínimo
      return cantidadCumplida / habReq.length >= umbral;
    },
    
    // Asignar desarrollador manualmente a una tarea sin candidatos
    // Solo guarda la selección, la validación se hará después al verificar disponibilidad
    assignDeveloperManually(tareaId, desarrolladorId) {
      if (!tareaId) {
        return; // Si no hay tareaId, no hacer nada (puede ser que se esté limpiando el select)
      }
      
      if (!desarrolladorId || desarrolladorId === '') {
        // Si se deselecciona, limpiar la asignación manual
        if (this.manualAssignments[tareaId]) {
          delete this.manualAssignments[tareaId];
        }
        if (this.candidatesData && this.candidatesData[tareaId] && this.candidatesData[tareaId].asignacionManual) {
          delete this.candidatesData[tareaId].asignacionManual;
        }
        return;
      }
      
      try {
        const tareaData = this.candidatesData[tareaId];
        if (!tareaData) {
          alert('No se encontró información de la tarea');
          return;
        }
        
        const tarea = tareaData.tarea;
        const dev = this.allDevelopers.find(d => d._id === desarrolladorId);
        
        if (!dev) {
          alert('Desarrollador no encontrado');
          return;
        }
        
        // Solo guardar la asignación manual, sin validar inmediatamente
        // La validación se hará cuando se verifique disponibilidad al continuar
        if (!this.manualAssignments) {
          this.manualAssignments = {};
        }
        this.manualAssignments[tareaId] = {
          tareaId: tarea.id,
          desarrolladorId: desarrolladorId
        };
        
        // Actualizar candidatesData para marcar que la tarea ya tiene asignación manual
        if (this.candidatesData && this.candidatesData[tareaId]) {
          this.candidatesData[tareaId].asignacionManual = {
            desarrolladorId: desarrolladorId,
            desarrollador: dev
          };
        }
        
        console.log('Asignación manual guardada (sin validar aún):', {
          tareaId,
          desarrolladorId,
          desarrollador: dev.nombre + ' ' + dev.apellido
        });
        
        // Forzar actualización de la vista
        this.$forceUpdate();
        
      } catch (error) {
        console.error('Error asignando desarrollador manualmente:', error);
        alert('Error al guardar la asignación manual. Por favor, intenta nuevamente.');
      }
    },
    
    // Verificar disponibilidad y aplicar asignaciones manuales
    async proceedToComparisonTable() {
      if (!this.selectedProject) {
        alert('Por favor selecciona un proyecto antes de continuar.');
        return;
      }
      
      this.isConfirming = true;
      
      try {
        // Si hay asignaciones manuales, verificar disponibilidad primero
        if (Object.keys(this.manualAssignments).length > 0) {
          // 1. Construir array de asignaciones manuales para verificar
          const asignacionesManuales = Object.entries(this.manualAssignments).map(([tareaId, data]) => ({
            tareaId: tareaId,
            desarrolladorId: data.desarrolladorId
          }));
          
          console.log('Verificando disponibilidad de asignaciones manuales:', asignacionesManuales);
          
          // 2. Verificar disponibilidad
          const verificacion = await AssignmentService.verificarDisponibilidadAsignacionesManuales({
            "asignaciones-manuales": asignacionesManuales
          });
          
          console.log('Resultado de verificación de disponibilidad:', verificacion);
          
          // 3. Si la verificación falla, mostrar errores y no continuar
          if (!verificacion.ok) {
            let mensajesError = [];
            
            if (verificacion.resultados && Array.isArray(verificacion.resultados)) {
              verificacion.resultados.forEach(r => {
                if (!r.disponible) {
                  mensajesError.push(`Tarea ${r.tareaId}: ${r.motivo}`);
                }
              });
            }
            
            if (verificacion.errores && Array.isArray(verificacion.errores)) {
              mensajesError.push(...verificacion.errores);
            }
            
            if (mensajesError.length === 0) {
              mensajesError.push('Uno o más desarrolladores no tienen disponibilidad suficiente.');
            }
            
            alert('Error de disponibilidad:\n\n' + mensajesError.join('\n'));
            this.isConfirming = false;
            return; // No continuar si hay errores
          }
          
          // 4. Si OK, aplicar asignaciones manuales al resumen completo
          if (!this.resumenSimulacion) {
            alert('Error: No se encontró el resumen de simulación. Por favor, intenta nuevamente.');
            this.isConfirming = false;
            return;
          }
          
          console.log('Aplicando asignaciones manuales al resumen completo...');
          
          // Construir payload con el resumen completo + asignaciones manuales
          const payload = {
            ...this.resumenSimulacion, // basica, costo, tiempoIA, calidad
            "asignaciones-manuales": asignacionesManuales
          };
          
          console.log('Payload para aplicar asignaciones:', payload);
          
          // 5. Aplicar asignaciones manuales
          const resultadoFinal = await AssignmentService.aplicarAsignacionesManuales(payload);
          
          console.log('Resultado final después de aplicar asignaciones:', resultadoFinal);
          
          // 6. Guardar resultado para mostrar en tabla
          if (resultadoFinal && resultadoFinal.data) {
            // El resultado incluye el resumen completo con las asignaciones aplicadas
            // y los globalesPorCriterio calculados
            this.resumenSimulacion = resultadoFinal.data;
            
            if (resultadoFinal.globalesPorCriterio) {
              // Actualizar comparisonData con los globales por criterio
              this.comparisonData = {};
              Object.keys(resultadoFinal.globalesPorCriterio).forEach(criterio => {
                const globales = resultadoFinal.globalesPorCriterio[criterio];
                this.comparisonData[criterio] = {
                  criterio: criterio,
                  costoTotal: globales.costoTotalSimulado || null,
                  tiempoTotal: globales.tiempoTotalSimulado || null,
                  calidad: globales.calidadPromedioSimulado || globales.calidadPromedioTareas || null,
                  isLoading: false,
                  previewData: null
                };
              });
            }
            
            // Ocultar vista de candidatos y mostrar tabla comparativa
            this.showCandidatesView = false;
            this.showComparisonTable = true;
            
            alert('Asignaciones aplicadas exitosamente. Revisa la tabla comparativa para ver los resultados.');
          } else {
            alert('Error: No se recibieron datos del resultado final.');
          }
        } else {
          // No hay asignaciones manuales, solo mostrar tabla comparativa usando el resumen existente
          this.showCandidatesView = false;
          this.showComparisonTable = true;
          
          // Construir comparisonData desde el resumen existente si está disponible
          if (this.resumenSimulacion) {
            this.comparisonData = {};
            // Los datos comparativos ya están en el resumen, no necesitamos recargarlos
            console.log('Mostrando tabla comparativa con resumen existente');
          }
        }
        
      } catch (error) {
        console.error('Error procesando asignaciones manuales:', error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Error desconocido';
        alert(`Error al procesar las asignaciones manuales: ${errorMsg}`);
      } finally {
        this.isConfirming = false;
      }
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

        const asignaciones = Array.isArray(previewResult.asignaciones)
          ? previewResult.asignaciones
          : Array.isArray(previewResult.sugerencias?.asignaciones)
            ? previewResult.sugerencias.asignaciones
            : Array.isArray(previewResult.sugerencias)
              ? previewResult.sugerencias
              : [];

        const costoTotal = typeof previewResult.costoTotalProyecto === 'number'
          ? previewResult.costoTotalProyecto
          : typeof previewResult.sugerencias?.costoTotalProyecto === 'number'
            ? previewResult.sugerencias.costoTotalProyecto
            : null;

        const defaultMessages = {
          availability: 'Previsualización generada correctamente.',
          cost: 'Previsualización por costo generada correctamente.',
          time: 'Previsualización de IA por tiempo generada correctamente.',
          quality: 'Previsualización de IA por calidad generada correctamente.'
        };

        const message = previewResult.message
          || previewResult.sugerencias?.message
          || defaultMessages[this.selectedAssignmentType] || 'Previsualización generada.';

        let confirmPayload = null;
        if (this.selectedAssignmentType === 'time') {
          confirmPayload = {
            success: previewResult.success !== undefined ? previewResult.success : true,
            criterio: 'tiempo',
            sugerencias: previewResult.sugerencias || {
              asignaciones,
              costoTotalProyecto: costoTotal
            }
          };
        } else if (this.selectedAssignmentType === 'quality') {
          confirmPayload = {
            success: previewResult.success !== undefined ? previewResult.success : true,
            criterio: 'calidad',
            sugerencias: previewResult.sugerencias || {
              asignaciones,
              costoTotalProyecto: costoTotal
            }
          };
        }

        this.previewData = {
          ...previewResult,
          asignaciones,
          costoTotalProyecto: costoTotal,
          message,
          confirmPayload
        };

        if (!asignaciones.length) {
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

    // Volver a la tabla comparativa
    backToComparisonTable() {
      if (this.previewData) {
        // Si venimos de la previsualización, volver a la tabla
        this.previewData = null;
        this.showComparisonTable = true;
      } else {
        // Si venimos de la selección de tipo, volver a la tabla
        this.showComparisonTable = true;
      }
    },

    // Volver a la selección de tipo desde confirmación
    backToSelectionType() {
      this.previewData = null;
      this.selectedAssignmentType = null;
      this.showComparisonTable = false;
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
          if (!this.previewData.confirmPayload) {
            throw new Error('No hay sugerencias disponibles para confirmar (tiempo).');
          }
          confirmResult = await AssignmentService.confirmTimeAssignment(
            this.selectedProject,
            this.previewData.confirmPayload
          );
        } else if (this.selectedAssignmentType === 'quality') {
          if (!this.previewData.confirmPayload) {
            throw new Error('No hay sugerencias disponibles para confirmar (calidad).');
          }
          confirmResult = await AssignmentService.confirmQualityAssignment(
            this.selectedProject,
            this.previewData.confirmPayload
          );
        }

        // Mostrar mensaje de éxito
        alert(`✅ ${confirmResult.message}\n\nAsignaciones guardadas correctamente.`);

        // Guardar resultados para mostrar en el resumen
        // Las respuestas de tiempo y calidad pueden tener estructura diferente
        const asignacionesToMap = this.previewData.asignaciones || [];
        this.assignmentResults = asignacionesToMap.map(asig => {
          const developerName = asig.desarrollador
            ? `${asig.desarrollador.nombre} ${asig.desarrollador.apellido || ''}`.trim()
            : asig.nombre
              ? `${asig.nombre} ${asig.apellido || ''}`.trim()
              : null;

          const costoPorHoraRaw = asig.costoPorHora ?? asig.desarrollador?.costoPorHora ?? asig.costoHora;
          const costoTotalRaw = asig.costoTotal ?? asig.totalCosto ?? asig.costTotal;

          const costoPorHora = Number.isFinite(Number(costoPorHoraRaw)) ? Number(costoPorHoraRaw) : null;
          const costoTotal = Number.isFinite(Number(costoTotalRaw)) ? Number(costoTotalRaw) : null;

          return {
            tarea: asig.tarea?.descripcion || asig.tarea || asig.descripcion,
            tareaId: asig.tarea?.id || asig.tareaId || null,
            asignado: developerName,
            desarrolladorId: asig.desarrollador?.id || asig.desarrolladorId || null,
            motivo: asig.motivo || null,
            razon: asig.razon || asig.reason || null,
            horasAsignadasTotales: asig.horasTotales || asig.horasAsignadas || 0,
            dias: asig.dias || [],
            costoPorHora,
            costoTotal,
            criterio: this.selectedAssignmentType,
            tipoAsignacion: asig.tipoAsignacion || this.selectedAssignmentType,
            proyecto: this.projects.find(p => p._id === this.selectedProject)?.name || null,
            proyectoId: this.selectedProject || null
          };
        });

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
    },
    
    // Métodos para iniciar y pausar/completar tareas
    async iniciarTarea(task) {
      // Validar que task existe
      if (!task) {
        console.error('Error: task es undefined o null', task);
        alert('Error: No se pudo obtener la información de la tarea. Por favor, recarga la página.');
        return;
      }
      
      // Validar que task tiene _id
      if (!task._id) {
        console.error('Error: task._id es undefined', task);
        alert('Error: La tarea no tiene un ID válido. Por favor, recarga la página.');
        return;
      }
      
      if (window.confirm('¿Estás seguro de que quieres iniciar esta tarea?')) {
        try {
          await TaskService.iniciarTarea(task._id);
          alert('✅ Tarea iniciada correctamente');
          await this.loadTasks();
        } catch (error) {
          console.error('Error iniciando tarea:', error);
          console.error('Error completo:', error.response?.data);
          
          let errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          // Si el error es sobre _id undefined, es un problema de autenticación en el backend
          if (errorMessage.includes("Cannot read properties of undefined (reading '_id')")) {
            errorMessage = 'Error de autenticación en el servidor. Por favor, cierra sesión y vuelve a iniciar sesión.';
          }
          
          if (error.response?.status === 400) {
            // Mostrar el mensaje específico del backend
            alert(`⚠️ No se puede iniciar la tarea:\n\n${errorMessage}\n\nRequisitos:\n- La tarea debe estar en estado "pendiente"\n- Debes estar autenticado como desarrollador`);
          } else if (error.response?.status === 401) {
            alert('❌ No tienes permisos para iniciar esta tarea. Por favor, inicia sesión nuevamente.');
          } else {
            alert(`❌ Error al iniciar la tarea:\n\n${errorMessage}`);
          }
        }
      }
    },
    
    async pausarOCompletarTarea(task) {
      // Validar que task existe
      if (!task) {
        console.error('Error: task es undefined o null', task);
        alert('Error: No se pudo obtener la información de la tarea. Por favor, recarga la página.');
        return;
      }
      
      // Validar que task tiene _id
      if (!task._id) {
        console.error('Error: task._id es undefined', task);
        alert('Error: La tarea no tiene un ID válido. Por favor, recarga la página.');
        return;
      }
      
      const action = task.estado === 'en curso' ? 'pausar o completar' : 'completar';
      if (window.confirm(`¿Estás seguro de que quieres ${action} esta tarea?`)) {
        try {
          await TaskService.pausarOCompletarTarea(task._id);
          alert('✅ Tarea actualizada correctamente');
          await this.loadTasks();
        } catch (error) {
          console.error('Error actualizando tarea:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          if (error.response?.status === 400) {
            alert(`⚠️ No se puede actualizar la tarea:\n\n${errorMessage}`);
          } else {
            alert(`❌ Error al actualizar la tarea:\n\n${errorMessage}`);
          }
        }
      }
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
