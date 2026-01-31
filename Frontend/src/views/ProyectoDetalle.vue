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
        <button 
          v-if="project?.status === 'Pendiente'" 
          class="btn btn-success me-2" 
          @click="iniciarProyecto"
          title="Iniciar proyecto"
        >
          <i class="bi bi-play-fill me-1"></i>
          Iniciar Proyecto
        </button>
        <button 
          v-if="project?.status === 'En Curso'" 
          class="btn btn-warning me-2" 
          @click="pausarProyecto"
          title="Pausar proyecto"
        >
          <i class="bi bi-pause-fill me-1"></i>
          Pausar
        </button>
        <button 
          v-if="project?.status === 'Pausado'" 
          class="btn btn-success me-2" 
          @click="iniciarProyecto"
          title="Reanudar proyecto"
        >
          <i class="bi bi-play-fill me-1"></i>
          Reanudar
        </button>
        <button 
          v-if="project?.status === 'En Curso'" 
          class="btn btn-secondary me-2" 
          @click="finalizarProyecto"
          title="Finalizar proyecto"
        >
          <i class="bi bi-check-circle me-1"></i>
          Finalizar
        </button>
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
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'asignaciones' }"
          @click="switchToAssignmentsTab"
        >
          Asignaciones
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
            <div class="tasks-actions">
              <button 
                class="btn btn-success me-2" 
                @click="openAssignmentTypeModal"
              >
                <i class="bi bi-robot me-1"></i>
                Asignación Automática
              </button>
              <button class="btn btn-primary btn-sm" @click="showAddTaskModal = true">
                <i class="bi bi-plus-circle me-1"></i>
                Nueva Tarea
              </button>
            </div>
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

      <!-- Tab Asignaciones -->
      <div v-if="activeTab === 'asignaciones'" class="tab-pane active">
        <div class="assignments-content">
          <div class="assignments-header">
            <h3>Resumen de Asignaciones</h3>
            <button 
              class="btn btn-outline-info btn-sm" 
              @click="diagnosticarProblemaAsignacion"
              title="Diagnosticar problemas de asignación"
            >
              <i class="bi bi-bug me-1"></i>
              Diagnosticar Problemas
            </button>
          </div>

          <!-- Información del proyecto -->
          <div class="project-assignment-info mb-4">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                  <i class="bi bi-info-circle me-2"></i>
                  Información del Proyecto
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Proyecto:</strong> {{ project?.name || 'N/A' }}</p>
                    <p><strong>Total de Tareas:</strong> {{ projectTasks.length }}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Tareas Asignadas:</strong> {{ assignedTasksCount }}</p>
                    <p><strong>Sin Asignar:</strong> {{ unassignedTasksCount }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen de asignaciones -->
          <div class="assignments-summary">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-list-check me-2"></i>
                  Detalle de Asignaciones
                </h5>
              </div>
              <div class="card-body">
                <div v-if="loadingAssignments" class="text-center py-4">
                  <div class="spinner-border" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </div>
                </div>
                
                <div v-else-if="!assignments || assignments.length === 0" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-1"></i>
                  <p class="mt-2">No hay asignaciones disponibles</p>
                  <p class="small">Las asignaciones aparecerán aquí cuando se ejecute la asignación automática.</p>
                </div>

                <div v-else>
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
                            <span v-if="assignment.tipoAsignacion" class="badge" :class="getAssignmentTypeClass(assignment.tipoAsignacion)">
                              <i class="bi" :class="getAssignmentTypeIcon(assignment.tipoAsignacion)"></i>
                              {{ getAssignmentTypeText(assignment.tipoAsignacion) }}
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
                                <span v-if="assignment.desarrollador?.habilidades && assignment.desarrollador.habilidades.length > 3" class="skill-badge more-skills">
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
                                <span v-if="assignment.dias && assignment.dias.length > 3" class="day-badge more-days">
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

          <!-- Estadísticas Resumen -->
          <div v-if="assignments && assignments.length > 0" class="row mt-4">
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

            <!-- Categoría -->
            <div class="mb-3">
              <label class="form-label">Categoría *</label>
              <select class="form-select" v-model="newTask.categoria" required>
                <option value="">Seleccionar categoría</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="testing">Testing</option>
                <option value="documentacion">Documentación</option>
                <option value="machine learning">Machine Learning</option>
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
                  <option value="pausada">Pausada</option>
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
                  :min="project?.startDate"
                  :max="project?.endDate"
                >
                <small class="text-muted" v-if="project?.startDate">
                  Rango válido: {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
                </small>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Estimada de Fin</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="newTask.fechaEstimadaFin"
                  :min="newTask.fechaEstimadaInicio || project?.startDate"
                  :max="project?.endDate"
                >
                <small class="text-muted" v-if="project?.endDate">
                  Máximo: {{ formatDate(project.endDate) }}
                </small>
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

    <!-- Modal para Seleccionar Tipo de Asignación Automática -->
    <div v-if="showAssignmentTypeModal" class="modal-overlay" @click="closeAssignmentTypeModal">
      <div class="modal-content assignment-type-modal" @click.stop>
        <div class="modal-header">
          <h5>
            <i class="bi bi-robot me-2"></i>Asignación Automática
          </h5>
          <button class="btn-close" @click="closeAssignmentTypeModal"></button>
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
                          <!-- Para asignación manual: mostrar todos los desarrolladores -->
                          <option 
                            v-for="dev in allDevelopers" 
                            :key="dev._id"
                            :value="dev._id"
                          >
                            {{ dev.nombre }} {{ dev.apellido }}
                            ({{ dev.aniosExperiencia || 0 }} años exp.)
                          </option>
                          <option v-if="allDevelopers.length === 0" disabled>
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
                      <th>Tiempo Total Estimado</th>
                      <th>Calidad del Proyecto</th>
                      <th>Calidad de las Tareas</th>
                      <th>Previsualización</th>
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
                          <span v-else-if="data && data.costoTotalSimulado !== null && data.costoTotalSimulado !== undefined" class="fw-bold text-success">
                            ${{ typeof data.costoTotalSimulado === 'number' ? data.costoTotalSimulado.toFixed(2) : data.costoTotalSimulado }}
                          </span>
                          <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                          <span v-if="data && data.isLoading" class="text-muted">
                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                          </span>
                          <span v-else-if="data && data.error" class="text-danger">-</span>
                          <span v-else-if="data && data.tiempoTotalSimulado !== null && data.tiempoTotalSimulado !== undefined" class="fw-bold">
                            {{ formatTiempo(data.tiempoTotalSimulado) }}
                          </span>
                          <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                          <span v-if="data && data.isLoading" class="text-muted">
                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                          </span>
                          <span v-else-if="data && data.error" class="text-danger">-</span>
                          <span v-else-if="data && data.tiempoTotalEstimado !== null && data.tiempoTotalEstimado !== undefined" class="fw-bold">
                            {{ formatTiempo(data.tiempoTotalEstimado) }}
                          </span>
                          <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                          <span v-if="data && data.isLoading" class="text-muted">
                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                          </span>
                          <span v-else-if="data && data.error" class="text-danger">-</span>
                          <span v-else-if="data && data.calidadPromedioSimulado !== null && data.calidadPromedioSimulado !== undefined" class="fw-bold">
                            {{ formatCalidad(data.calidadPromedioSimulado) }}
                          </span>
                          <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                          <span v-if="data && data.isLoading" class="text-muted">
                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                          </span>
                          <span v-else-if="data && data.error" class="text-danger">-</span>
                          <span v-else-if="data && data.calidadPromedioTareas !== null && data.calidadPromedioTareas !== undefined" class="fw-bold">
                            {{ formatCalidad(data.calidadPromedioTareas) }}
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
                    <h4 class="mb-0" v-if="comparisonData && comparisonData[getCriterioKey(selectedAssignmentType)]?.tiempoTotalSimulado">
                      {{ formatTiempo(comparisonData[getCriterioKey(selectedAssignmentType)].tiempoTotalSimulado) }}
                    </h4>
                    <span v-else class="text-muted">N/A</span>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 bg-light">
                  <div class="card-body text-center">
                    <h6 class="text-muted mb-2">Calidad</h6>
                    <h4
                      class="mb-0"
                      v-if="comparisonData && comparisonData[getCriterioKey(selectedAssignmentType)] && (comparisonData[getCriterioKey(selectedAssignmentType)].calidadPromedioSimulado != null || comparisonData[getCriterioKey(selectedAssignmentType)].calidadPromedioTareas != null)"
                    >
                      {{ formatCalidad(
                        comparisonData[getCriterioKey(selectedAssignmentType)].calidadPromedioSimulado
                          ?? comparisonData[getCriterioKey(selectedAssignmentType)].calidadPromedioTareas
                      ) }}
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
              class="btn btn-primary me-2" 
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

    <!-- Modal para Ver Detalles de Tarea -->
    <div class="modal fade" id="viewTaskModal" tabindex="-1" aria-labelledby="viewTaskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="viewTaskModalLabel">
              <i class="bi bi-info-circle me-2"></i>Detalles Completos de la Tarea
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeViewTaskModal" aria-label="Close"></button>
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
                      <span class="badge fs-6" :class="getTaskStatusClass(selectedTask.estado)">
                        {{ getTaskStatusText(selectedTask.estado) }}
                      </span>
                    </div>
                    <div class="mb-2">
                      <strong>Prioridad:</strong><br>
                      <span class="badge fs-6" :class="getTaskPriorityClass(selectedTask.prioridad)">
                        {{ getTaskPriorityText(selectedTask.prioridad) }}
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
                      <strong>{{ project?.name || 'N/A' }}</strong>
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
            <button type="button" class="btn btn-secondary" @click="closeViewTaskModal">
              <i class="bi bi-x-circle me-1"></i>Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProjectService from '@/services/project.service.js';
import TaskService from '@/services/task.service.js';
import SkillsService from '@/services/skills.service.js';
import AssignmentService from '@/services/assignment.service.js';
import UserService from '@/services/user.service.js';
import ValidationService from '@/services/validation.service.js';
import { Modal } from 'bootstrap';

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
        categoria: '',
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
      users: [],
      // Propiedades para el tab de asignaciones
      assignments: [],
      loadingAssignments: false,
      isAssigning: false,
      // Variables para el modal de selección de tipo de asignación
      showAssignmentTypeModal: false,
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
      resumenSimulacion: null, // Resumen completo de simulación (basica, costo, tiempoIA, calidad)
      
      // Para edición de asignaciones
      selectedAssignmentForEdit: null,
      assignmentForm: {
        newDeveloperId: ''
      },
      isUpdatingAssignment: false,
      editAssignmentModalInstance: null,
      
      // Para el modal de ver detalles de tarea
      selectedTask: null,
      viewTaskModalInstance: null
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
    },

    // Propiedades computadas para asignaciones
    assignedTasksCount() {
      return this.projectTasks.filter(task => task.desarrolladorAsignado).length;
    },

    unassignedTasksCount() {
      return this.projectTasks.filter(task => !task.desarrolladorAsignado).length;
    },

    filteredAssignments() {
      // En el detalle de proyecto, mostrar todas las asignaciones sin filtros
      return this.assignments || [];
    },
    
    uniqueDevelopers() {
      if (!this.assignments || this.assignments.length === 0) return [];
      const developers = this.assignments
        .filter(a => a.asignado)
        .map(a => a.asignado);
      return [...new Set(developers)];
    },
    
    totalHoursAssigned() {
      if (!this.assignments || this.assignments.length === 0) return 0;
      return this.assignments
        .filter(a => a.horasAsignadasTotales)
        .reduce((total, a) => total + a.horasAsignadasTotales, 0);
    },
    
    // Para edición de asignaciones
    availableUsers() {
      return this.users.filter(user => user.rol === 'user');
    },
    
    selectedNewDeveloper() {
      if (!this.assignmentForm.newDeveloperId) return null;
      return this.users.find(user => user._id === this.assignmentForm.newDeveloperId);
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
  async mounted() {
    await this.loadProject();
    await this.loadProjectTasks();
    await this.loadSkills();
    await this.loadUsers();
    this.initializeModals();
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
        if (!this.newTask.categoria) {
          throw new Error('Debe seleccionar una categoría');
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
          categoria: this.newTask.categoria,
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
            categoria: this.newTask.categoria,
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
        categoria: '',
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
      this.selectedTask = task;
      if (this.viewTaskModalInstance) {
        this.viewTaskModalInstance.show();
      }
    },
    
    // Cerrar modal de ver detalles de tarea
    closeViewTaskModal() {
      if (this.viewTaskModalInstance) {
        this.viewTaskModalInstance.hide();
      }
      this.selectedTask = null;
    },
    
    // Editar tarea
    editTask(task) {
      // Pre-poblar el formulario con los datos de la tarea
      this.newTask = {
        descripcion: task.descripcion,
        prioridad: task.prioridad,
        nivelDificultad: task.nivelDificultad?.toString() || '',
        categoria: task.categoria || '',
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
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Usar métodos UTC para evitar cambios por zona horaria
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    },

    // Métodos para el tab de asignaciones
    async runAutoAssignment() {
      const projectId = this.$route.params.id;
      console.log('🔍 ProyectoDetalle - Iniciando asignación automática para proyecto:', projectId);
      
      this.isAssigning = true;
      
      try {
        // Validar tareas del proyecto antes de la asignación automática
        const validationResults = await this.validateProjectTasksForAssignment(projectId);
        
        if (!validationResults.isValid) {
          alert(`No se puede ejecutar la asignación automática: ${validationResults.message}`);
          return;
        }
        
        console.log(`✅ Proyecto ${this.project.name}: Todas las tareas pasaron las validaciones`);
        
        // Llamar al endpoint del backend para asignación automática
        const resultado = await AssignmentService.runAutomaticAssignment(projectId);
        
        console.log('🔍 ProyectoDetalle - Resultado asignación desde backend:', resultado);
        
        if (resultado.resumen && resultado.resumen.length > 0) {
          // Guardar las asignaciones localmente
          this.assignments = resultado.resumen.map(assignment => ({
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
              habilidades: assignment.desarrollador?.habilidades || []
            },
            
            // Nombre del desarrollador para compatibilidad
            asignado: assignment.desarrollador?.nombre || 'Desarrollador no disponible',
            
            // Información de días y horas
            horasAsignadasTotales: assignment.horasTotales || 0,
            dias: assignment.dias || [],
            
            // Tipo de asignación (basica o costo)
            tipoAsignacion: assignment.tipoAsignacion || 'basica',
            
            // Fecha de asignación
            fechaAsignacion: assignment.creadoEn || new Date().toISOString()
          }));
          
          console.log('✅ ProyectoDetalle - Asignaciones cargadas:', this.assignments.length);
          
          // Recargar las tareas del proyecto para reflejar los cambios
          await this.loadProjectTasks();
          
          alert('Asignación automática completada exitosamente!');
        } else {
          console.log('ℹ️ ProyectoDetalle - No se encontraron tareas para asignar');
          alert('No se encontraron tareas para asignar en este proyecto.');
        }
        
      } catch (error) {
        console.error('Error ejecutando asignación automática:', error);
        alert('Error ejecutando asignación automática: ' + error.message);
      } finally {
        this.isAssigning = false;
      }
    },

    // Métodos para el modal de selección de tipo de asignación
    async openAssignmentTypeModal() {
      this.selectedAssignmentType = null;
      this.previewData = null;
      this.isLoadingPreview = false;
      this.isConfirming = false;
      this.comparisonData = null;
      this.showComparisonTable = false; // NO mostrar tabla comparativa por defecto
      this.showCandidatesView = true; // Mostrar vista de candidatos inicialmente
      this.showAssignmentTypeModal = true;
      this.manualAssignments = {}; // Limpiar asignaciones manuales
      this.resumenSimulacion = null; // Limpiar resumen anterior
      this.isLoadingCandidates = true; // Indicar que se está cargando candidatos
      
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
      this.showAssignmentTypeModal = false;
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

    // Cargar resumen de simulación y extraer candidatos de la parte "basica"
    async loadResumenSimulacion() {
      this.isLoadingCandidates = true;
      const projectId = this.$route.params.id;
      
      try {
        // 1. Obtener resumen completo de simulación
        const resumen = await AssignmentService.getResumenSimulacion(projectId);
        console.log('📊 Resumen de simulación recibido:', resumen);
        
        // Guardar el resumen completo para usarlo después
        this.resumenSimulacion = resumen;
        
        // 2. Obtener todos los desarrolladores para asignación manual
        const usersResponse = await UserService.getUsers();
        const desarrolladores = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        
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
        
        // Crear un set de desarrolladores que aparecen en asignaciones de "basica" (para asignación manual)
        const devsEnBasica = new Set();
        asignacionesBasica.forEach(asig => {
          if (asig.desarrolladorId) {
            devsEnBasica.add(asig.desarrolladorId);
          }
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
        this.comparisonData = this.buildComparisonDataFromResumen(resumen);
        
        console.log('✅ ComparisonData construido desde resumen:', this.comparisonData);
        console.log('✅ Asignaciones en disponibilidad:', this.comparisonData?.disponibilidad?.previewData?.asignaciones);
        
        // 6. Mostrar automáticamente la vista de candidatos (NO la tabla comparativa)
        this.showCandidatesView = true;
        this.showComparisonTable = false;
        
      } catch (error) {
        console.error('Error cargando resumen de simulación:', error);
        alert('Error al cargar el resumen de simulación. Por favor, intenta nuevamente.');
        this.closeAssignmentTypeModal();
      } finally {
        this.isLoadingCandidates = false;
        this.isLoadingComparison = false;
      }
    },

    buildComparisonDataFromResumen(resumen) {
      const comparisonData = {};
      const criterios = [
        { resumenKey: 'basica', comparacionKey: 'disponibilidad', name: 'Disponibilidad' },
        { resumenKey: 'costo', comparacionKey: 'costo', name: 'Costo' },
        { resumenKey: 'tiempo', comparacionKey: 'tiempo', name: 'Tiempo' },
        { resumenKey: 'calidad', comparacionKey: 'calidad', name: 'Calidad' }
      ];

      criterios.forEach(({ resumenKey, comparacionKey, name }) => {
        const criterioData = resumen?.[resumenKey];
        if (!criterioData || !criterioData.asignaciones) {
          comparisonData[comparacionKey] = {
            criterio: comparacionKey,
            error: `No hay datos disponibles para ${name}`,
            costoTotalSimulado: null,
            tiempoTotalSimulado: null,
            tiempoTotalEstimado: null,
            calidadPromedioSimulado: null,
            calidadPromedioTareas: null,
            costoTotal: null,
            tiempoTotal: null,
            calidad: null,
            previewData: null,
            isLoading: false
          };
          return;
        }

        const asignaciones = criterioData.asignaciones || [];

        const parseNumber = (value) => {
          if (typeof value === 'number') return value;
          if (value == null) return null;
          const num = Number(value);
          return Number.isNaN(num) ? null : num;
        };

        let costoTotalSimulado = parseNumber(
          criterioData.costoTotalSimulado ??
          criterioData.costoTotalProyecto ??
          criterioData.sugerencias?.costoTotalProyecto
        );

        if (costoTotalSimulado == null) {
          costoTotalSimulado = asignaciones.reduce((sum, a) => {
            const costo = typeof a.costoTotal === 'number' ? a.costoTotal : Number(a.costoTotal) || 0;
            return sum + costo;
          }, 0);
        }

        let tiempoTotalEstimado = parseNumber(
          criterioData.tiempoTotalEstimado ??
          criterioData.sugerencias?.tiempoTotalEstimado
        );

        if (tiempoTotalEstimado == null) {
          tiempoTotalEstimado = asignaciones.reduce((sum, a) => {
            const horasTotales = a.horasTotales != null
              ? (typeof a.horasTotales === 'number' ? a.horasTotales : Number(a.horasTotales) || 0)
              : 0;
            return sum + horasTotales;
          }, 0);
        }

        let tiempoTotalSimulado = parseNumber(
          criterioData.tiempoTotalSimulado ??
          criterioData.tiempoTotalEstimadoRealProyecto ??
          criterioData.sugerencias?.tiempoTotalEstimadoRealProyecto
        );

        if (tiempoTotalSimulado == null) {
          tiempoTotalSimulado = asignaciones.reduce((sum, a) => {
            const horasSimuladas = a.horasEstimadasSegunRendimiento != null
              ? (typeof a.horasEstimadasSegunRendimiento === 'number' ? a.horasEstimadasSegunRendimiento : Number(a.horasEstimadasSegunRendimiento) || 0)
              : (a.horasTotales != null ? (typeof a.horasTotales === 'number' ? a.horasTotales : Number(a.horasTotales) || 0) : 0);
            return sum + horasSimuladas;
          }, 0);
        }

        let calidadPromedioTareas = parseNumber(criterioData.calidadPromedioTareas);
        const calidadesValidas = asignaciones
          .map(a => {
            const cal = a.calidadTarea != null
              ? (typeof a.calidadTarea === 'number' ? a.calidadTarea : Number(a.calidadTarea))
              : null;
            return isNaN(cal) ? null : cal;
          })
          .filter(cal => cal != null && cal > 0);

        if (calidadPromedioTareas == null && calidadesValidas.length > 0) {
          calidadPromedioTareas = calidadesValidas.reduce((sum, cal) => sum + cal, 0) / calidadesValidas.length;
          calidadPromedioTareas = Number(calidadPromedioTareas.toFixed(2));
        }

        let calidadPromedioSimulado = parseNumber(criterioData.calidadPromedioSimulado);
        const feedbacksValidos = asignaciones
          .map(a => {
            const fb = a.feedbackHistorico != null
              ? (typeof a.feedbackHistorico === 'number' ? a.feedbackHistorico : Number(a.feedbackHistorico))
              : null;
            return isNaN(fb) || fb === 0 ? null : fb;
          })
          .filter(fb => fb != null && fb > 0);

        if (calidadPromedioSimulado == null && feedbacksValidos.length > 0) {
          calidadPromedioSimulado = feedbacksValidos.reduce((sum, fb) => sum + fb, 0) / feedbacksValidos.length;
          calidadPromedioSimulado = Number(calidadPromedioSimulado.toFixed(2));
        }

        comparisonData[comparacionKey] = {
          criterio: comparacionKey,
          costoTotalSimulado: costoTotalSimulado > 0 ? costoTotalSimulado : null,
          tiempoTotalSimulado: tiempoTotalSimulado > 0 ? tiempoTotalSimulado : null,
          tiempoTotalEstimado: tiempoTotalEstimado > 0 ? tiempoTotalEstimado : null,
          calidadPromedioSimulado: calidadPromedioSimulado,
          calidadPromedioTareas: calidadPromedioTareas,
          costoTotal: costoTotalSimulado > 0 ? costoTotalSimulado : null,
          tiempoTotal: tiempoTotalSimulado > 0 ? tiempoTotalSimulado : null,
          calidad: calidadPromedioSimulado ?? calidadPromedioTareas ?? null,
          isLoading: false,
          previewData: {
            asignaciones: asignaciones,
            costoTotalProyecto: costoTotalSimulado > 0 ? costoTotalSimulado : null,
            tiempoTotalEstimado: tiempoTotalEstimado > 0 ? tiempoTotalEstimado : null,
            tiempoTotalSimulado: tiempoTotalSimulado > 0 ? tiempoTotalSimulado : null,
            calidadPromedioTareas: calidadPromedioTareas,
            calidadPromedioSimulado: calidadPromedioSimulado,
            projectId: criterioData.projectId || this.$route.params.id
          }
        };
      });

      return comparisonData;
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
        
          const tasksById = new Map(
            (this.projectTasks || []).map(t => [String(t._id || t.id), t])
          );
        
          const basicaConFechas = {
            ...this.resumenSimulacion.basica,
            asignaciones: (this.resumenSimulacion.basica?.asignaciones || []).map(a => {
              const taskId = String(a.tareaId || a.tarea?.id || a._id || '');
              const tareaDesdeLista = tasksById.get(taskId);
              const tareaDesdeCandidatos = this.candidatesData?.[taskId]?.tarea;
              return {
                ...a,
                descripcion:
                  a.descripcion ??
                  tareaDesdeCandidatos?.descripcion ??
                  tareaDesdeLista?.descripcion,
                fechaEstimadaInicio:
                  a.fechaEstimadaInicio ??
                  tareaDesdeCandidatos?.fechaEstimadaInicio ??
                  tareaDesdeLista?.fechaEstimadaInicio,
                fechaEstimadaFin:
                  a.fechaEstimadaFin ??
                  tareaDesdeCandidatos?.fechaEstimadaFin ??
                  tareaDesdeLista?.fechaEstimadaFin,
                tiempoEstimadoHoras:
                  a.tiempoEstimadoHoras ??
                  tareaDesdeCandidatos?.estimacionHoras ??
                  tareaDesdeLista?.tiempoEstimadoHoras ??
                  tareaDesdeLista?.estimacionHoras ??
                  a.horasTotales,
                habilidadesRequeridas:
                  a.habilidadesRequeridas ??
                  tareaDesdeCandidatos?.habilidadesRequeridas ??
                  tareaDesdeLista?.habilidadesRequeridas,
                prioridad:
                  a.prioridad ??
                  tareaDesdeCandidatos?.prioridad ??
                  tareaDesdeLista?.prioridad
              };
            })
          };
        
          // Construir payload con el resumen completo + asignaciones manuales
          const payload = {
            ...this.resumenSimulacion, // basica, costo, tiempoIA, calidad
            basica: basicaConFechas,
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
              const criterios = [
                { resumenKey: 'basica', comparacionKey: 'disponibilidad', name: 'Disponibilidad' },
                { resumenKey: 'costo', comparacionKey: 'costo', name: 'Costo' },
                { resumenKey: 'tiempo', comparacionKey: 'tiempo', name: 'Tiempo' },
                { resumenKey: 'calidad', comparacionKey: 'calidad', name: 'Calidad' }
              ];

              criterios.forEach(({ resumenKey, comparacionKey, name }) => {
                const globales = resultadoFinal.globalesPorCriterio?.[resumenKey];
                const criterioData = this.resumenSimulacion?.[resumenKey];

                if (!criterioData || !Array.isArray(criterioData.asignaciones)) {
                  this.comparisonData[comparacionKey] = {
                    criterio: comparacionKey,
                    error: `No hay datos disponibles para ${name}`,
                    costoTotalSimulado: null,
                    tiempoTotalSimulado: null,
                    tiempoTotalEstimado: null,
                    calidadPromedioSimulado: null,
                    calidadPromedioTareas: null,
                    costoTotal: null,
                    tiempoTotal: null,
                    calidad: null,
                    isLoading: false,
                    previewData: null
                  };
                  return;
                }

                this.comparisonData[comparacionKey] = {
                  criterio: comparacionKey,
                  costoTotalSimulado: globales?.costoTotalSimulado ?? null,
                  tiempoTotalSimulado: globales?.tiempoTotalSimulado ?? null,
                  tiempoTotalEstimado: globales?.tiempoTotalEstimado ?? null,
                  calidadPromedioSimulado: globales?.calidadPromedioSimulado ?? null,
                  calidadPromedioTareas: globales?.calidadPromedioTareas ?? null,
                  costoTotal: globales?.costoTotalSimulado ?? null,
                  tiempoTotal: globales?.tiempoTotalSimulado ?? null,
                  calidad:
                    globales?.calidadPromedioSimulado ??
                    globales?.calidadPromedioTareas ??
                    null,
                  isLoading: false,
                  previewData: {
                    asignaciones: criterioData.asignaciones,
                    costoTotalProyecto: globales?.costoTotalSimulado ?? null,
                    tiempoTotalEstimado: globales?.tiempoTotalEstimado ?? null,
                    tiempoTotalSimulado: globales?.tiempoTotalSimulado ?? null,
                    calidadPromedioTareas: globales?.calidadPromedioTareas ?? null,
                    calidadPromedioSimulado: globales?.calidadPromedioSimulado ?? null,
                    projectId: criterioData.projectId || this.$route.params.id
                  }
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
            this.comparisonData = this.buildComparisonDataFromResumen(this.resumenSimulacion);
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
    
    // Cargar datos comparativos de los 4 criterios (secuencialmente para evitar rate limits)
    async loadComparisonData() {
      this.isLoadingComparison = true;
      const projectId = this.$route.params.id;
      
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
            
            // 1. Llamar a la previsualización
            const previewData = await serviceMethod(projectId);
            console.log(`📊 Preview de ${criterioName} recibido:`, previewData);
            
            // 2. Verificar si hay tareas sin candidatos y pedir al usuario qué desarrollador asignar
            const asignacionesConDev = await this.procesarTareasSinCandidatos(
              previewData.asignaciones || [], 
              criterioName
            );
            
            // 3. Crear el resultadoIA con las asignaciones (con desarrolladorId si había sinCandidatos)
            const resultadoIA = {
              projectId: previewData.projectId || projectId,
              asignaciones: asignacionesConDev
            };
            
            // 4. Pasar el resultado a completar-manual
            const resultadoCompleto = await AssignmentService.completeManualAssignments(resultadoIA);
            console.log(`📊 Resultado completo de ${criterioName} (después de completar-manual):`, resultadoCompleto);
            
            // 5. Extraer los datos del resultado completo (que ya tiene los datos globales calculados)
            const extracted = this.extractComparisonData(resultadoCompleto, criterioKey);
            console.log(`📊 Datos extraídos de ${criterioName}:`, extracted);
            
            // Actualizar solo este criterio en comparisonData (Vue 3: asignación directa)
            this.comparisonData[criterioKey] = extracted;
            console.log(`${criterioName} cargado correctamente`);
            return extracted;
          } catch (err) {
            console.error(`Error cargando ${criterioName}:`, err);
            const errorData = {
              criterio: criterioKey,
              error: err.response?.data?.error || err.message || 'Error desconocido',
              costoTotalSimulado: null,
              tiempoTotalSimulado: null,
              tiempoTotalEstimado: null,
              calidadPromedioSimulado: null,
              calidadPromedioTareas: null,
              costoTotal: null,
              tiempoTotal: null,
              calidad: null,
              previewData: null,
              isLoading: false
            };
            // Vue 3: asignación directa (this.$set no existe en Vue 3)
            this.comparisonData[criterioKey] = errorData;
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
            costoTotalSimulado: null,
            tiempoTotalSimulado: null,
            tiempoTotalEstimado: null,
            calidadPromedioSimulado: null,
            calidadPromedioTareas: null,
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
            costoTotalSimulado: null,
            tiempoTotalSimulado: null,
            tiempoTotalEstimado: null,
            calidadPromedioSimulado: null,
            calidadPromedioTareas: null,
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

        // Calcular valores globales desde las asignaciones si no vienen en la respuesta
        // Priorizar los campos que devuelve calcularDatosGlobalesSimulacion
        let costoTotalSimulado = null;
        if (typeof data.costoTotalSimulado === 'number') {
          costoTotalSimulado = data.costoTotalSimulado;
        } else if (data.costoTotalSimulado != null) {
          const costoNum = Number(data.costoTotalSimulado);
          if (!isNaN(costoNum)) costoTotalSimulado = costoNum;
        } else if (typeof data.costoTotalProyecto === 'number') {
          costoTotalSimulado = data.costoTotalProyecto;
        } else if (typeof data.sugerencias?.costoTotalProyecto === 'number') {
          costoTotalSimulado = data.sugerencias.costoTotalProyecto;
        } else if (data.costoTotalProyecto != null) {
          const costoNum = Number(data.costoTotalProyecto);
          if (!isNaN(costoNum)) costoTotalSimulado = costoNum;
        } else if (data.sugerencias?.costoTotalProyecto != null) {
          const costoNum = Number(data.sugerencias.costoTotalProyecto);
          if (!isNaN(costoNum)) costoTotalSimulado = costoNum;
        }
        
        // Si no se encontró, calcular desde las asignaciones
        if (costoTotalSimulado == null && asignaciones.length > 0) {
          costoTotalSimulado = asignaciones.reduce((sum, a) => {
            const costo = typeof a.costoTotal === 'number' ? a.costoTotal : Number(a.costoTotal) || 0;
            return sum + costo;
          }, 0);
        }

        // Tiempo simulado: buscar primero en la respuesta
        let tiempoTotalSimulado = null;
        if (typeof data.tiempoTotalSimulado === 'number') {
          tiempoTotalSimulado = data.tiempoTotalSimulado;
        } else if (data.tiempoTotalSimulado != null) {
          const tiempoNum = Number(data.tiempoTotalSimulado);
          if (!isNaN(tiempoNum)) tiempoTotalSimulado = tiempoNum;
        } else if (typeof data.tiempoTotalEstimadoRealProyecto === 'number') {
          tiempoTotalSimulado = data.tiempoTotalEstimadoRealProyecto;
        } else if (typeof data.sugerencias?.tiempoTotalEstimadoRealProyecto === 'number') {
          tiempoTotalSimulado = data.sugerencias.tiempoTotalEstimadoRealProyecto;
        } else if (data.tiempoTotalEstimadoRealProyecto != null) {
          const tiempoNum = Number(data.tiempoTotalEstimadoRealProyecto);
          if (!isNaN(tiempoNum)) tiempoTotalSimulado = tiempoNum;
        } else if (data.sugerencias?.tiempoTotalEstimadoRealProyecto != null) {
          const tiempoNum = Number(data.sugerencias.tiempoTotalEstimadoRealProyecto);
          if (!isNaN(tiempoNum)) tiempoTotalSimulado = tiempoNum;
        }
        
        // Si no se encontró, calcular desde las asignaciones
        if (tiempoTotalSimulado == null && asignaciones.length > 0) {
          tiempoTotalSimulado = asignaciones.reduce((sum, a) => {
            // Usar horasEstimadasSegunRendimiento si existe, sino horasTotales
            const horas = a.horasEstimadasSegunRendimiento != null 
              ? (typeof a.horasEstimadasSegunRendimiento === 'number' ? a.horasEstimadasSegunRendimiento : Number(a.horasEstimadasSegunRendimiento) || 0)
              : (a.horasTotales != null ? (typeof a.horasTotales === 'number' ? a.horasTotales : Number(a.horasTotales) || 0) : 0);
            return sum + horas;
          }, 0);
        }

        // Tiempo estimado: buscar primero en la respuesta
        let tiempoTotalEstimado = null;
        if (typeof data.tiempoTotalEstimado === 'number') {
          tiempoTotalEstimado = data.tiempoTotalEstimado;
        } else if (data.tiempoTotalEstimado != null) {
          const tiempoNum = Number(data.tiempoTotalEstimado);
          if (!isNaN(tiempoNum)) tiempoTotalEstimado = tiempoNum;
        } else if (typeof data.sugerencias?.tiempoTotalEstimado === 'number') {
          tiempoTotalEstimado = data.sugerencias.tiempoTotalEstimado;
        } else if (data.sugerencias?.tiempoTotalEstimado != null) {
          const tiempoNum = Number(data.sugerencias.tiempoTotalEstimado);
          if (!isNaN(tiempoNum)) tiempoTotalEstimado = tiempoNum;
        } else if (typeof data.tiempoTotalEstimadoRealProyecto === 'number') {
          tiempoTotalEstimado = data.tiempoTotalEstimadoRealProyecto;
        }
        
        if (tiempoTotalEstimado == null && asignaciones.length > 0) {
          tiempoTotalEstimado = asignaciones.reduce((sum, a) => {
            const horasTotales = a.horasTotales != null
              ? (typeof a.horasTotales === 'number' ? a.horasTotales : Number(a.horasTotales) || 0)
              : 0;
            return sum + horasTotales;
          }, 0);
        }

        // Calidad tareas: buscar primero en la respuesta
        let calidadPromedioTareas = null;
        if (typeof data.calidadPromedioTareas === 'number') {
          calidadPromedioTareas = data.calidadPromedioTareas;
        } else if (typeof data.sugerencias?.calidadPromedioTareas === 'number') {
          calidadPromedioTareas = data.sugerencias.calidadPromedioTareas;
        } else if (data.calidadPromedioTareas != null && data.calidadPromedioTareas !== '') {
          const calidadNum = Number(data.calidadPromedioTareas);
          if (!isNaN(calidadNum)) {
            calidadPromedioTareas = calidadNum;
          }
        }
        
        if (calidadPromedioTareas == null && asignaciones.length > 0) {
          const calidadesValidas = asignaciones
            .map(a => {
              const cal = a.calidadTarea != null
                ? (typeof a.calidadTarea === 'number' ? a.calidadTarea : Number(a.calidadTarea))
                : null;
              return isNaN(cal) ? null : cal;
            })
            .filter(cal => cal != null);
          
          if (calidadesValidas.length > 0) {
            calidadPromedioTareas = calidadesValidas.reduce((sum, cal) => sum + cal, 0) / calidadesValidas.length;
            calidadPromedioTareas = Number(calidadPromedioTareas.toFixed(2));
          }
        }

        // Calidad proyecto (simulada): buscar primero en la respuesta
        let calidadPromedioSimulado = null;
        if (typeof data.calidadPromedioSimulado === 'number') {
          calidadPromedioSimulado = data.calidadPromedioSimulado;
        } else if (typeof data.sugerencias?.calidadPromedioSimulado === 'number') {
          calidadPromedioSimulado = data.sugerencias.calidadPromedioSimulado;
        } else if (data.calidadPromedioSimulado != null && data.calidadPromedioSimulado !== '') {
          const calidadNum = Number(data.calidadPromedioSimulado);
          if (!isNaN(calidadNum)) {
            calidadPromedioSimulado = calidadNum;
          }
        } else if (typeof data.calidadPromedioProyecto === 'number') {
          calidadPromedioSimulado = data.calidadPromedioProyecto;
        } else if (typeof data.sugerencias?.calidadPromedioProyecto === 'number') {
          calidadPromedioSimulado = data.sugerencias.calidadPromedioProyecto;
        }
        
        if (calidadPromedioSimulado == null && asignaciones.length > 0) {
          const feedbacksValidos = asignaciones
            .map(a => {
              const fb = a.feedbackHistorico != null
                ? (typeof a.feedbackHistorico === 'number' ? a.feedbackHistorico : Number(a.feedbackHistorico))
                : null;
              return isNaN(fb) || fb === 0 ? null : fb;
            })
            .filter(fb => fb != null && fb > 0);
          
          if (feedbacksValidos.length > 0) {
            calidadPromedioSimulado = feedbacksValidos.reduce((sum, fb) => sum + fb, 0) / feedbacksValidos.length;
            calidadPromedioSimulado = Number(calidadPromedioSimulado.toFixed(2));
          }
        }

        // Guardar los datos completos para la previsualización
        let confirmPayload = null;
        if (criterio === 'time' || criterio === 'quality') {
          confirmPayload = {
            success: data.success !== undefined ? data.success : true,
            criterio: criterio === 'time' ? 'tiempo' : 'calidad',
            sugerencias: data.sugerencias || {
              asignaciones,
              costoTotalProyecto: costoTotalSimulado
            }
          };
        }

        return {
          criterio,
          costoTotalSimulado,
          tiempoTotalSimulado,
          tiempoTotalEstimado,
          calidadPromedioSimulado,
          calidadPromedioTareas,
          costoTotal: costoTotalSimulado,
          tiempoTotal: tiempoTotalSimulado,
          calidad: calidadPromedioSimulado ?? calidadPromedioTareas ?? null,
          isLoading: false,
          previewData: {
            ...data,
            asignaciones,
            costoTotalProyecto: costoTotalSimulado,
            costoTotalSimulado: costoTotalSimulado,
            tiempoTotalEstimado: tiempoTotalEstimado,
            tiempoTotalEstimadoRealProyecto: tiempoTotalEstimado,
            tiempoTotalSimulado: tiempoTotalSimulado,
            calidadPromedioTareas: calidadPromedioTareas,
            calidadPromedioSimulado: calidadPromedioSimulado,
            confirmPayload
          }
        };
      } catch (error) {
        console.error(`Error extrayendo datos para criterio ${criterio}:`, error);
        return {
          criterio,
          error: error.message || 'Error al procesar datos',
          costoTotalSimulado: null,
          tiempoTotalSimulado: null,
          tiempoTotalEstimado: null,
          calidadPromedioSimulado: null,
          calidadPromedioTareas: null,
          costoTotal: null,
          tiempoTotal: null,
          calidad: null,
          previewData: null,
          isLoading: false
        };
      }
    },

    // Procesar tareas sin candidatos y pedir al usuario qué desarrollador asignar
    async procesarTareasSinCandidatos(asignaciones, criterioName) {
      const asignacionesProcesadas = [];
      const tareasSinCandidatos = asignaciones.filter(a => a.sinCandidatos === true);
      
      // Si no hay tareas sin candidatos, devolver las asignaciones tal cual
      if (tareasSinCandidatos.length === 0) {
        return asignaciones;
      }
      
      // Si hay tareas sin candidatos, pedir al usuario qué desarrollador asignar
      for (const asignacion of asignaciones) {
        if (asignacion.sinCandidatos === true) {
          // Pedir al usuario qué desarrollador asignar
          const desarrolladorId = await this.pedirDesarrolladorParaTarea(
            asignacion, 
            criterioName
          );
          
          if (desarrolladorId) {
            // Agregar el desarrolladorId a la asignación antes de enviarla a completar-manual
            asignacionesProcesadas.push({
              ...asignacion,
              desarrolladorId: desarrolladorId
            });
          } else {
            // Si el usuario canceló, dejar la asignación sin desarrollador
            asignacionesProcesadas.push(asignacion);
          }
        } else {
          // Si ya tiene desarrollador, dejarla tal cual
          asignacionesProcesadas.push(asignacion);
        }
      }
      
      return asignacionesProcesadas;
    },

    // Método para pedir al usuario qué desarrollador asignar (usando modal de Bootstrap)
    async pedirDesarrolladorParaTarea(asignacion, criterioName) {
      return new Promise((resolve) => {
        // Obtener desarrolladores disponibles
        const developers = this.availableUsers.length > 0 
          ? this.availableUsers 
          : this.users.filter(user => user.rol === 'user');
        
        if (developers.length === 0) {
          alert('No hay desarrolladores disponibles para asignar.');
          resolve(null);
          return;
        }

        const tareaDesc = asignacion.descripcion || asignacion.tarea?.descripcion || 'Tarea sin descripción';
        const tareaNombre = asignacion.nombre || asignacion.tarea?.nombre || 'Tarea';
        
        // Crear el HTML del modal
        const modalId = `modal-asignar-dev-${Date.now()}`;
        const modalHtml = `
          <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="${modalId}Label">Asignar Desarrollador Manualmente</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p><strong>Tarea:</strong> ${tareaNombre}</p>
                  <p class="text-muted small">${tareaDesc}</p>
                  <p class="mb-3"><strong>Criterio:</strong> ${criterioName}</p>
                  <p class="text-warning mb-3">Esta tarea no tiene candidatos disponibles. Por favor, selecciona un desarrollador para asignarla manualmente.</p>
                  <label class="form-label">Desarrollador:</label>
                  <select class="form-select" id="select-dev-${modalId}">
                    <option value="">Seleccionar desarrollador...</option>
                    ${developers.map(dev => 
                      `<option value="${dev._id}">${dev.nombre} ${dev.apellido || ''} ${dev.aniosExperiencia ? `(${dev.aniosExperiencia} años exp.)` : ''}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                  <button type="button" class="btn btn-primary" id="confirmAssignBtn-${modalId}">Asignar</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Agregar el modal al DOM
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modalElement = tempDiv.firstElementChild;
        document.body.appendChild(modalElement);
        
        // Inicializar el modal de Bootstrap
        const modal = new Modal(modalElement);
        modal.show();
        
        const selectElement = document.getElementById(`select-dev-${modalId}`);
        const confirmBtn = document.getElementById(`confirmAssignBtn-${modalId}`);
        
        // Handler para el botón de confirmar
        const handleConfirm = () => {
          const selectedId = selectElement.value;
          modal.hide();
          // Esperar a que el modal se oculte antes de removerlo
          modalElement.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modalElement);
          }, { once: true });
          resolve(selectedId || null);
        };
        
        // Handler para cancelar
        const handleCancel = () => {
          modal.hide();
          modalElement.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modalElement);
          }, { once: true });
          resolve(null);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        modalElement.querySelector('.btn-secondary').addEventListener('click', handleCancel);
        modalElement.querySelector('.btn-close').addEventListener('click', handleCancel);
        
        // Permitir Enter en el select para confirmar
        selectElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && selectElement.value) {
            handleConfirm();
          }
        });
      });
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

    // Generar previsualización
    async generatePreview() {
      if (!this.selectedAssignmentType) {
        alert('Por favor selecciona un tipo de asignación');
        return;
      }

      this.isLoadingPreview = true;

      try {
        const projectId = this.$route.params.id;
        let previewResult;
        
        if (this.selectedAssignmentType === 'availability') {
          previewResult = await AssignmentService.previewBasicAssignment(projectId);
        } else if (this.selectedAssignmentType === 'cost') {
          previewResult = await AssignmentService.previewCostAssignment(projectId);
        } else if (this.selectedAssignmentType === 'time') {
          previewResult = await AssignmentService.previewTimeAssignment(projectId);
        } else if (this.selectedAssignmentType === 'quality') {
          previewResult = await AssignmentService.previewQualityAssignment(projectId);
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
            projectId,
            asignaciones,
            costoTotalSimulado: costoTotal,
            tiempoTotalEstimado: previewResult.tiempoTotalEstimado ?? previewResult.sugerencias?.tiempoTotalEstimado ?? null,
            tiempoTotalSimulado: previewResult.tiempoTotalSimulado ?? previewResult.sugerencias?.tiempoTotalSimulado ?? null,
            calidadPromedioTareas: previewResult.calidadPromedioTareas ?? previewResult.sugerencias?.calidadPromedioTareas ?? null,
            calidadPromedioSimulado: previewResult.calidadPromedioSimulado ?? previewResult.sugerencias?.calidadPromedioSimulado ?? null,
            criterio: 'tiempo',
          };
        } else if (this.selectedAssignmentType === 'quality') {
          confirmPayload = {
            projectId,
            asignaciones,
            costoTotalSimulado: costoTotal,
            tiempoTotalEstimado: previewResult.tiempoTotalEstimado ?? previewResult.sugerencias?.tiempoTotalEstimado ?? null,
            tiempoTotalSimulado: previewResult.tiempoTotalSimulado ?? previewResult.sugerencias?.tiempoTotalSimulado ?? null,
            calidadPromedioTareas: previewResult.calidadPromedioTareas ?? previewResult.sugerencias?.calidadPromedioTareas ?? null,
            calidadPromedioSimulado: previewResult.calidadPromedioSimulado ?? previewResult.sugerencias?.calidadPromedioSimulado ?? null,
            criterio: 'calidad',
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
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error desconocido';
        
        // Detectar el error específico de tareas ya asignadas
        if (errorMsg.includes('Todas las tareas del proyecto ya están asignadas') || 
            errorMsg.includes('ya están asignadas')) {
          const mensajeCompleto = `⚠️ ${errorMsg}\n\n` +
            `Esto puede deberse a datos inconsistentes en la base de datos.\n\n` +
            `Solución:\n` +
            `1. Ve a la pestaña "Asignaciones"\n` +
            `2. Haz clic en "Diagnosticar Problemas"\n` +
            `3. Sigue las instrucciones para limpiar los datos inconsistentes`;
          alert(mensajeCompleto);
        } else {
          alert(`Error generando previsualización: ${errorMsg}`);
        }
      } finally {
        this.isLoadingPreview = false;
      }
    },

    // Volver a la selección de tipo
    backToSelection() {
      this.previewData = null;
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

    // Construir payload de confirmación cuando viene desde comparación/resumen
    buildConfirmPayloadFromPreview(criterio) {
      const asignaciones = this.previewData?.asignaciones
        || this.previewData?.sugerencias?.asignaciones
        || [];

      if (!asignaciones.length) {
        return null;
      }

      const sumNumber = (value) => (value == null || Number.isNaN(Number(value)) ? 0 : Number(value));

      const computedCostoTotal = asignaciones.reduce((sum, a) => sum + sumNumber(a.costoTotal), 0);
      const computedTiempoTotalEstimado = asignaciones.reduce((sum, a) => sum + sumNumber(a.horasTotales), 0);
      const computedTiempoTotalSimulado = asignaciones.reduce((sum, a) => {
        const horas = a.horasEstimadasSegunRendimiento != null
          ? a.horasEstimadasSegunRendimiento
          : a.horasTotales;
        return sum + sumNumber(horas);
      }, 0);

      const calidadesTareas = asignaciones
        .map(a => (a.calidadTarea != null ? Number(a.calidadTarea) : null))
        .filter(c => c != null && !Number.isNaN(c) && c > 0);
      const computedCalidadPromedioTareas = calidadesTareas.length
        ? calidadesTareas.reduce((sum, c) => sum + c, 0) / calidadesTareas.length
        : 0;

      const calidadesSimuladas = asignaciones
        .map(a => (a.feedbackHistorico != null ? Number(a.feedbackHistorico) : null))
        .filter(c => c != null && !Number.isNaN(c) && c > 0);
      const computedCalidadPromedioSimulado = calidadesSimuladas.length
        ? calidadesSimuladas.reduce((sum, c) => sum + c, 0) / calidadesSimuladas.length
        : 0;

      const costoTotalSimulado = this.previewData?.costoTotalSimulado
        ?? this.previewData?.costoTotalProyecto
        ?? this.previewData?.sugerencias?.costoTotalProyecto
        ?? computedCostoTotal;

      const tiempoTotalEstimado = this.previewData?.tiempoTotalEstimado
        ?? this.previewData?.sugerencias?.tiempoTotalEstimado
        ?? computedTiempoTotalEstimado;

      const tiempoTotalSimulado = this.previewData?.tiempoTotalSimulado
        ?? this.previewData?.tiempoTotalEstimadoRealProyecto
        ?? this.previewData?.sugerencias?.tiempoTotalEstimadoRealProyecto
        ?? computedTiempoTotalSimulado;

      const calidadPromedioTareas = this.previewData?.calidadPromedioTareas
        ?? this.previewData?.sugerencias?.calidadPromedioTareas
        ?? computedCalidadPromedioTareas;

      const calidadPromedioSimulado = this.previewData?.calidadPromedioSimulado
        ?? this.previewData?.sugerencias?.calidadPromedioSimulado
        ?? computedCalidadPromedioSimulado;

      return {
        projectId: this.$route.params.id,
        asignaciones,
        costoTotalSimulado,
        tiempoTotalEstimado,
        tiempoTotalSimulado,
        calidadPromedioTareas,
        calidadPromedioSimulado,
        criterio
      };
    },

    // Confirmar y guardar asignaciones
    async confirmAssignment() {
      if (!this.previewData || !this.selectedAssignmentType) {
        return;
      }

      this.isConfirming = true;

      try {
        const projectId = this.$route.params.id;
        let confirmResult;

        if (this.selectedAssignmentType === 'availability') {
          // Construir payload completo para el backend
          const asignaciones = this.previewData.asignaciones || [];
          
          // Calcular totales desde las asignaciones si no están disponibles
          const costoTotalSimulado = this.previewData.costoTotalSimulado != null 
            ? this.previewData.costoTotalSimulado 
            : (this.previewData.costoTotalProyecto != null ? this.previewData.costoTotalProyecto : asignaciones.reduce((sum, a) => sum + (Number(a.costoTotal) || 0), 0));
          
          const tiempoTotalEstimado = this.previewData.tiempoTotalEstimado != null 
            ? this.previewData.tiempoTotalEstimado 
            : asignaciones.reduce((sum, a) => sum + (Number(a.horasTotales) || 0), 0);
          
          const tiempoTotalSimulado = this.previewData.tiempoTotalSimulado != null 
            ? this.previewData.tiempoTotalSimulado 
            : asignaciones.reduce((sum, a) => sum + (Number(a.horasEstimadasSegunRendimiento || a.horasTotales) || 0), 0);
          
          // Calcular calidad promedio
          const calidades = asignaciones
            .map(a => a.calidadTarea != null ? Number(a.calidadTarea) : null)
            .filter(c => c != null && !isNaN(c) && c > 0);
          const calidadPromedioTareas = calidades.length > 0 
            ? calidades.reduce((sum, c) => sum + c, 0) / calidades.length 
            : 0;
          const calidadPromedioSimulado = this.previewData.calidadPromedioSimulado != null 
            ? this.previewData.calidadPromedioSimulado 
            : calidadPromedioTareas;
          
          const payload = {
            projectId,
            asignaciones,
            costoTotalSimulado: costoTotalSimulado || 0,
            tiempoTotalEstimado: tiempoTotalEstimado || 0,
            tiempoTotalSimulado: tiempoTotalSimulado || 0,
            calidadPromedioTareas: calidadPromedioTareas || 0,
            calidadPromedioSimulado: calidadPromedioSimulado || 0,
            criterio: 'basica'
          };
          
          confirmResult = await AssignmentService.confirmBasicAssignment(projectId, payload);
        } else if (this.selectedAssignmentType === 'cost') {
          // Construir payload completo para el backend (mismo formato que básica)
          const asignaciones = this.previewData.asignaciones || [];
          
          const costoTotalSimulado = this.previewData.costoTotalSimulado != null 
            ? this.previewData.costoTotalSimulado 
            : (this.previewData.costoTotalProyecto != null ? this.previewData.costoTotalProyecto : asignaciones.reduce((sum, a) => sum + (Number(a.costoTotal) || 0), 0));
          
          const tiempoTotalEstimado = this.previewData.tiempoTotalEstimado != null 
            ? this.previewData.tiempoTotalEstimado 
            : asignaciones.reduce((sum, a) => sum + (Number(a.horasTotales) || 0), 0);
          
          const tiempoTotalSimulado = this.previewData.tiempoTotalSimulado != null 
            ? this.previewData.tiempoTotalSimulado 
            : asignaciones.reduce((sum, a) => sum + (Number(a.horasEstimadasSegunRendimiento || a.horasTotales) || 0), 0);
          
          const calidades = asignaciones
            .map(a => a.calidadTarea != null ? Number(a.calidadTarea) : null)
            .filter(c => c != null && !isNaN(c) && c > 0);
          const calidadPromedioTareas = calidades.length > 0 
            ? calidades.reduce((sum, c) => sum + c, 0) / calidades.length 
            : 0;
          const calidadPromedioSimulado = this.previewData.calidadPromedioSimulado != null 
            ? this.previewData.calidadPromedioSimulado 
            : calidadPromedioTareas;
          
          const payload = {
            projectId,
            asignaciones,
            costoTotalSimulado: costoTotalSimulado || 0,
            tiempoTotalEstimado: tiempoTotalEstimado || 0,
            tiempoTotalSimulado: tiempoTotalSimulado || 0,
            calidadPromedioTareas: calidadPromedioTareas || 0,
            calidadPromedioSimulado: calidadPromedioSimulado || 0,
            criterio: 'costo'
          };
          
          confirmResult = await AssignmentService.confirmCostAssignment(projectId, payload);
        } else if (this.selectedAssignmentType === 'time') {
          const confirmPayload = this.previewData.confirmPayload
            || this.buildConfirmPayloadFromPreview('tiempo');
          if (!confirmPayload) {
            throw new Error('No hay sugerencias disponibles para confirmar (tiempo).');
          }
          confirmResult = await AssignmentService.confirmTimeAssignment(
            projectId,
            confirmPayload
          );
        } else if (this.selectedAssignmentType === 'quality') {
          const confirmPayload = this.previewData.confirmPayload
            || this.buildConfirmPayloadFromPreview('calidad');
          if (!confirmPayload) {
            throw new Error('No hay sugerencias disponibles para confirmar (calidad).');
          }
          confirmResult = await AssignmentService.confirmQualityAssignment(
            projectId,
            confirmPayload
          );
        }

        // Mostrar mensaje de éxito
        alert(`✅ ${confirmResult.message}\n\nAsignaciones guardadas correctamente.`);

        // Recargar tareas y asignaciones
        await this.loadProjectTasks();
        await this.loadExistingAssignments();

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
      const projectId = this.$route.params.id;
      console.log('🔍 ProyectoDetalle - Iniciando asignación por disponibilidad y habilidades para proyecto:', projectId);
      
      try {
        // Validar tareas del proyecto antes de la asignación automática
        const validationResults = await this.validateProjectTasksForAssignment(projectId);
        
        if (!validationResults.isValid) {
          alert(`No se puede ejecutar la asignación automática: ${validationResults.message}`);
          return;
        }
        
        console.log(`✅ Proyecto ${this.project.name}: Todas las tareas pasaron las validaciones`);
        
        // Llamar al endpoint de asignación por disponibilidad
        const resultado = await AssignmentService.runAvailabilityBasedAssignment(projectId);
        
        console.log('🔍 ProyectoDetalle - Resultado asignación por disponibilidad:', resultado);
        
        // Recargar las tareas para mostrar los cambios
        await this.loadProjectTasks();
        
        // Mostrar mensaje de éxito
        alert('Asignación automática por disponibilidad completada exitosamente');
        
      } catch (error) {
        console.error('Error ejecutando asignación por disponibilidad:', error);
        throw error;
      }
    },

    async runCostBasedAssignment() {
      const projectId = this.$route.params.id;
      console.log('🔍 ProyectoDetalle - Iniciando asignación por costo para proyecto:', projectId);
      
      try {
        // Validar tareas del proyecto antes de la asignación automática
        const validationResults = await this.validateProjectTasksForAssignment(projectId);
        
        if (!validationResults.isValid) {
          alert(`No se puede ejecutar la asignación automática: ${validationResults.message}`);
          return;
        }
        
        console.log(`✅ Proyecto ${this.project.name}: Todas las tareas pasaron las validaciones`);
        
        // Llamar al endpoint de asignación por costo
        const resultado = await AssignmentService.runCostBasedAssignment(projectId);
        
        console.log('🔍 ProyectoDetalle - Resultado asignación por costo:', resultado);
        
        // Recargar las tareas para mostrar los cambios
        await this.loadProjectTasks();
        
        // Mostrar mensaje de éxito
        alert('Asignación automática por costo completada exitosamente');
        
      } catch (error) {
        console.error('Error ejecutando asignación por costo:', error);
        throw error;
      }
    },

    async runTimeBasedAssignment() {
      const projectId = this.$route.params.id;
      console.log('🔍 ProyectoDetalle - Iniciando asignación por tiempo para proyecto:', projectId);
      
      try {
        // Validar tareas del proyecto antes de la asignación automática
        const validationResults = await this.validateProjectTasksForAssignment(projectId);
        
        if (!validationResults.isValid) {
          alert(`No se puede ejecutar la asignación automática: ${validationResults.message}`);
          return;
        }
        
        console.log(`✅ Proyecto ${this.project.name}: Todas las tareas pasaron las validaciones`);
        
        // Llamar al endpoint de asignación por tiempo
        const preview = await AssignmentService.previewTimeAssignment(projectId);
        const asignaciones = Array.isArray(preview?.sugerencias?.asignaciones)
          ? preview.sugerencias.asignaciones
          : Array.isArray(preview?.asignaciones)
            ? preview.asignaciones
            : [];

        if (!asignaciones.length) {
          alert('No se encontraron tareas para asignar en este proyecto.');
          return;
        }

        const payload = {
          success: preview.success !== undefined ? preview.success : true,
          criterio: preview.criterio || 'tiempo',
          sugerencias: preview.sugerencias || {
            asignaciones,
            costoTotalProyecto: preview.costoTotalProyecto ?? null
          }
        };

        const resultado = await AssignmentService.confirmTimeAssignment(projectId, payload);
        
        console.log('🔍 ProyectoDetalle - Resultado asignación por tiempo:', resultado);
        
        // Recargar las tareas para mostrar los cambios
        await this.loadProjectTasks();
        
        // Mostrar mensaje de éxito
        alert('Asignación automática por tiempo completada exitosamente');
        
      } catch (error) {
        console.error('Error ejecutando asignación por tiempo:', error);
        throw error;
      }
    },

    async runQualityBasedAssignment() {
      const projectId = this.$route.params.id;
      console.log('🔍 ProyectoDetalle - Iniciando asignación por calidad para proyecto:', projectId);
      
      try {
        // Validar tareas del proyecto antes de la asignación automática
        const validationResults = await this.validateProjectTasksForAssignment(projectId);
        
        if (!validationResults.isValid) {
          alert(`No se puede ejecutar la asignación automática: ${validationResults.message}`);
          return;
        }
        
        console.log(`✅ Proyecto ${this.project.name}: Todas las tareas pasaron las validaciones`);
        
        // Llamar al endpoint de asignación por calidad
        const preview = await AssignmentService.previewQualityAssignment(projectId);
        const asignaciones = Array.isArray(preview?.sugerencias?.asignaciones)
          ? preview.sugerencias.asignaciones
          : Array.isArray(preview?.asignaciones)
            ? preview.asignaciones
            : [];

        if (!asignaciones.length) {
          alert('No se encontraron tareas para asignar en este proyecto.');
          return;
        }

        const payload = {
          success: preview.success !== undefined ? preview.success : true,
          criterio: preview.criterio || 'calidad',
          sugerencias: preview.sugerencias || {
            asignaciones,
            costoTotalProyecto: preview.costoTotalProyecto ?? null
          }
        };

        const resultado = await AssignmentService.confirmQualityAssignment(projectId, payload);
        
        console.log('🔍 ProyectoDetalle - Resultado asignación por calidad:', resultado);
        
        // Recargar las tareas para mostrar los cambios
        await this.loadProjectTasks();
        
        // Mostrar mensaje de éxito
        alert('Asignación automática por calidad completada exitosamente');
        
      } catch (error) {
        console.error('Error ejecutando asignación por calidad:', error);
        throw error;
      }
    },

    async validateProjectTasksForAssignment(projectId) {
      try {
        // Obtener tareas del proyecto
        const tasks = await TaskService.getTasksByProject(projectId);
        
        if (!tasks || tasks.length === 0) {
          return { isValid: true, message: 'No hay tareas para validar' };
        }

        // Obtener todos los desarrolladores
        const usersResponse = await UserService.getUsers();
        const developers = usersResponse.data.filter(user => user.rol === 'user');

        if (developers.length === 0) {
          return { isValid: false, message: 'No hay desarrolladores disponibles para asignación' };
        }

        let validTasksCount = 0;
        let invalidTasksCount = 0;
        const invalidTasks = [];

        // Validar cada tarea
        for (const task of tasks) {
          // Solo validar tareas sin asignar
          if (task.desarrolladorAsignado) {
            validTasksCount++;
            continue;
          }

          // Validar que la tarea tenga fechas y horas estimadas
          if (!task.fechaEstimadaInicio || !task.fechaEstimadaFin || !task.tiempoEstimadoHoras) {
            invalidTasksCount++;
            invalidTasks.push({
              task: task.descripcion,
              reason: 'Faltan fechas o tiempo estimado'
            });
            continue;
          }

          // Validar horas del mismo día
          const sameDayValidation = ValidationService.validateSameDayHours({
            fechaEstimadaInicio: task.fechaEstimadaInicio,
            fechaEstimadaFin: task.fechaEstimadaFin,
            tiempoEstimadoHoras: task.tiempoEstimadoHoras
          });

          if (!sameDayValidation.isValid) {
            invalidTasksCount++;
            invalidTasks.push({
              task: task.descripcion,
              reason: sameDayValidation.message
            });
            continue;
          }

          // Verificar si hay al menos un desarrollador disponible
          let hasAvailableDeveloper = false;
          for (const developer of developers) {
            // Validar disponibilidad
            const availabilityValidation = await ValidationService.validateDeveloperAvailability(
              developer._id,
              task.fechaEstimadaInicio,
              task.fechaEstimadaFin,
              task.tiempoEstimadoHoras
            );

            // Validar habilidades
            const skillsValidation = ValidationService.validateSkillsMatch(
              developer.habilidades || [],
              task.habilidadesRequeridas || []
            );

            if (availabilityValidation.isValid && skillsValidation.isValid) {
              hasAvailableDeveloper = true;
              break;
            }
          }

          if (hasAvailableDeveloper) {
            validTasksCount++;
          } else {
            invalidTasksCount++;
            invalidTasks.push({
              task: task.descripcion,
              reason: 'No hay desarrolladores disponibles con las habilidades requeridas y disponibilidad'
            });
          }
        }

        if (invalidTasksCount > 0) {
          const invalidTasksList = invalidTasks.slice(0, 3).map(t => `- ${t.task}: ${t.reason}`).join('\n');
          const moreTasks = invalidTasks.length > 3 ? `\n... y ${invalidTasks.length - 3} tareas más` : '';
          
          return {
            isValid: false,
            message: `Se encontraron ${invalidTasksCount} tareas que no pueden ser asignadas:\n${invalidTasksList}${moreTasks}`,
            validTasks: validTasksCount,
            invalidTasks: invalidTasksCount
          };
        }

        return {
          isValid: true,
          message: `Todas las ${validTasksCount} tareas pueden ser asignadas`,
          validTasks: validTasksCount,
          invalidTasks: 0
        };

      } catch (error) {
        console.error('Error validando tareas del proyecto:', error);
        return {
          isValid: false,
          message: 'Error al validar las tareas del proyecto'
        };
      }
    },

    getAssignmentTypeClass(tipo) {
      if (tipo === 'costo') return 'bg-success';
      return 'bg-primary';
    },
    
    getAssignmentTypeIcon(tipo) {
      if (tipo === 'costo') return 'bi-currency-dollar me-1';
      return 'bi-clock-history me-1';
    },
    
    getAssignmentTypeText(tipo) {
      if (tipo === 'costo') return 'Por Costo';
      if (tipo === 'basica') return 'Por Disponibilidad';
      return 'Tipo Desconocido';
    },

    async diagnosticarProblemaAsignacion() {
      const projectId = this.$route.params.id;
      
      try {
        // 1. Obtener información del proyecto
        const project = await ProjectService.getProjectById(projectId);
        
        // 2. Obtener todas las tareas del proyecto
        const tasks = await TaskService.getTasksByProject(projectId);
        
        // 3. Obtener asignaciones existentes
        let asignaciones = [];
        try {
          const assignmentsResponse = await AssignmentService.getAssignmentsByProject(projectId);
          asignaciones = assignmentsResponse.asignaciones || [];
        } catch (error) {
          // Error silencioso al obtener asignaciones
        }
        
        // 4. Analizar tareas
        const analisis = {
          totalTareas: tasks.length,
          tareasPendientes: 0,
          tareasConDesarrollador: 0,
          tareasSinDesarrollador: 0,
          tareasConAsignacion: 0,
          tareasSinDatos: [],
          tareasInconsistentes: [],
          idsTareasAsignadas: asignaciones.map(a => a.tarea?._id || a.tarea)
        };
        
        tasks.forEach(task => {
          if (task.estado === 'pendiente') {
            analisis.tareasPendientes++;
            
            if (task.desarrolladorAsignado) {
              analisis.tareasConDesarrollador++;
            } else {
              analisis.tareasSinDesarrollador++;
              
              // Verificar si tiene registro en Asignacion pero no desarrolladorAsignado
              if (analisis.idsTareasAsignadas.includes(task._id)) {
                analisis.tareasInconsistentes.push({
                  id: task._id,
                  descripcion: task.descripcion,
                  problema: 'Tiene registro en Asignacion pero desarrolladorAsignado es null'
                });
              }
              
              // Verificar datos requeridos
              if (!task.fechaEstimadaInicio || !task.fechaEstimadaFin || !task.tiempoEstimadoHoras) {
                analisis.tareasSinDatos.push({
                  id: task._id,
                  descripcion: task.descripcion,
                  faltantes: [
                    !task.fechaEstimadaInicio ? 'fechaEstimadaInicio' : null,
                    !task.fechaEstimadaFin ? 'fechaEstimadaFin' : null,
                    !task.tiempoEstimadoHoras ? 'tiempoEstimadoHoras' : null
                  ].filter(Boolean)
                });
              }
            }
          }
          
          if (analisis.idsTareasAsignadas.includes(task._id)) {
            analisis.tareasConAsignacion++;
          }
        });
        
        // 5. Obtener desarrolladores
        const usersResponse = await UserService.getUsers();
        const developers = usersResponse.data.filter(user => user.rol === 'user');
        
        // 6. Mostrar diagnóstico
        const mensaje = `
🔍 DIAGNÓSTICO DEL PROYECTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Proyecto: ${project.data.name || project.data.nombre}
📝 Total de tareas: ${analisis.totalTareas}
⏳ Tareas pendientes: ${analisis.tareasPendientes}
✅ Tareas con desarrollador asignado: ${analisis.tareasConDesarrollador}
❌ Tareas sin desarrollador: ${analisis.tareasSinDesarrollador}
📌 Registros en Asignacion: ${analisis.tareasConAsignacion}
👥 Desarrolladores disponibles: ${developers.length}

${analisis.tareasInconsistentes.length > 0 ? `
⚠️ PROBLEMA DETECTADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hay ${analisis.tareasInconsistentes.length} tarea(s) con datos inconsistentes:
${analisis.tareasInconsistentes.map(t => `  - "${t.descripcion}": ${t.problema}`).join('\n')}

SOLUCIÓN: Eliminar los registros huérfanos de Asignacion para estas tareas.
` : ''}

${analisis.tareasSinDatos.length > 0 ? `
❌ TAREAS SIN DATOS REQUERIDOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analisis.tareasSinDatos.map(t => `  - "${t.descripcion}": Faltan ${t.faltantes.join(', ')}`).join('\n')}
` : ''}

${analisis.tareasPendientes === 0 ? `
⚠️ No hay tareas pendientes para asignar.
` : ''}

${analisis.tareasSinDesarrollador === 0 && analisis.tareasPendientes > 0 ? `
✅ Todas las tareas pendientes ya tienen desarrollador asignado.
` : ''}

${developers.length === 0 ? `
❌ No hay desarrolladores disponibles (rol: user).
` : ''}
        `.trim();
        
        alert(mensaje);
        
        return analisis;
        
      } catch (error) {
        alert(`Error al diagnosticar: ${error.message}`);
        throw error;
      }
    },

    async switchToAssignmentsTab() {
      this.activeTab = 'asignaciones';
      await this.loadExistingAssignments();
    },

    async loadExistingAssignments() {
      const projectId = this.$route.params.id;
      this.loadingAssignments = true;
      
      try {
        console.log('🔍 ProyectoDetalle - Cargando asignaciones existentes para proyecto:', projectId);
        
        // Cargar asignaciones desde el backend (igual que en AssignmentSummaryView)
        try {
          const assignmentsResponse = await AssignmentService.getAssignmentsByProject(projectId);
          console.log('🔍 ProyectoDetalle - Respuesta del backend:', assignmentsResponse);
          
          if (assignmentsResponse.asignaciones && assignmentsResponse.asignaciones.length > 0) {
            console.log('🔍 ProyectoDetalle - Primera asignación del backend:', assignmentsResponse.asignaciones[0]);
            console.log('🔍 ProyectoDetalle - Tarea de la primera asignación:', assignmentsResponse.asignaciones[0].tarea);
            console.log('🔍 ProyectoDetalle - Fechas de la tarea:', {
              fechaEstimadaInicio: assignmentsResponse.asignaciones[0].tarea?.fechaEstimadaInicio,
              fechaEstimadaFin: assignmentsResponse.asignaciones[0].tarea?.fechaEstimadaFin
            });
            
            this.assignments = assignmentsResponse.asignaciones.map(assignment => ({
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
                habilidades: assignment.desarrollador?.habilidades || []
              },
              
              // Nombre del desarrollador para compatibilidad
              asignado: assignment.desarrollador?.nombre || 'Desarrollador no disponible',
              
              // Información de días y horas
              horasAsignadasTotales: assignment.horasTotales || 0,
              dias: assignment.dias || [],
              
              // Tipo de asignación (basica o costo)
              tipoAsignacion: assignment.tipoAsignacion || 'basica',
              
              // Fecha de asignación
              fechaAsignacion: assignment.creadoEn || new Date().toISOString()
            }));
            
            console.log('✅ ProyectoDetalle - Asignaciones mapeadas:', this.assignments);
            console.log('✅ ProyectoDetalle - Primera asignación mapeada:', this.assignments[0]);
            console.log('✅ ProyectoDetalle - Tarea de la primera asignación mapeada:', this.assignments[0]?.tarea);
            console.log('✅ ProyectoDetalle - Fechas de la tarea mapeada:', {
              fechaEstimadaInicio: this.assignments[0]?.tarea?.fechaEstimadaInicio,
              fechaEstimadaFin: this.assignments[0]?.tarea?.fechaEstimadaFin
            });
          } else {
            console.log('ℹ️ ProyectoDetalle - No hay asignaciones para este proyecto');
            this.assignments = [];
          }
        } catch (error) {
          // Si es un error 400, significa que no hay asignaciones para este proyecto
          if (error.response && error.response.status === 400) {
            console.log('ℹ️ ProyectoDetalle - Proyecto no tiene asignaciones (error 400 esperado)');
            this.assignments = [];
          } else {
            console.error('❌ ProyectoDetalle - Error cargando asignaciones:', error);
            this.assignments = [];
          }
        }
      } finally {
        this.loadingAssignments = false;
      }
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
      if (status === 'En Curso') return 'status-active';
      if (status === 'Pendiente') return 'status-pending';
      if (status === 'Pausado') return 'status-paused';
      if (status === 'Finalizado') return 'status-finished';
      return 'status-pending';
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
      if (status === 'pausada') return 'status-paused';
      return 'status-pending';
    },
    
    getTaskStatusText(status) {
      if (status === 'completada') return 'Completada';
      if (status === 'en curso') return 'En Progreso';
      if (status === 'pausada') return 'Pausada';
      return 'Pendiente';
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
    },
    
    // Métodos para edición de asignaciones
    initializeModals() {
      this.$nextTick(() => {
        // Modal de edición de asignación
        const modalElement = document.getElementById('editAssignmentModal');
        if (modalElement) {
          this.editAssignmentModalInstance = new Modal(modalElement);
        } else {
          console.warn('Modal element not found, retrying...');
          setTimeout(() => {
            const retryElement = document.getElementById('editAssignmentModal');
            if (retryElement) {
              this.editAssignmentModalInstance = new Modal(retryElement);
            }
          }, 100);
        }
        
        // Modal de ver detalles de tarea
        const viewTaskModalElement = document.getElementById('viewTaskModal');
        if (viewTaskModalElement) {
          this.viewTaskModalInstance = new Modal(viewTaskModalElement);
        } else {
          console.warn('ViewTaskModal element not found, retrying...');
          setTimeout(() => {
            const retryElement = document.getElementById('viewTaskModal');
            if (retryElement) {
              this.viewTaskModalInstance = new Modal(retryElement);
            }
          }, 100);
        }
      });
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
        await AssignmentService.editAssignment(
          this.selectedAssignmentForEdit.asignacionId, 
          this.assignmentForm.newDeveloperId
        );
        
        // Recargar las asignaciones para mostrar los cambios actualizados
        await this.loadExistingAssignments();
        
        alert('Asignación actualizada correctamente.\n\nLos calendarios de disponibilidad de ambos desarrolladores han sido actualizados automáticamente.');
        this.closeEditAssignmentModal();
        
      } catch (error) {
        console.error('Error actualizando asignación:', error);
        alert('Error al actualizar la asignación: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isUpdatingAssignment = false;
      }
    },
    
    // Métodos para iniciar, pausar y finalizar proyecto
    async iniciarProyecto() {
      if (!this.project?._id) return;
      
      if (window.confirm('¿Estás seguro de que quieres iniciar este proyecto?')) {
        try {
          await ProjectService.iniciarProyecto(this.project._id);
          alert('✅ Proyecto iniciado correctamente');
          await this.loadProject();
        } catch (error) {
          console.error('Error iniciando proyecto:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          if (error.response?.status === 400) {
            alert(`⚠️ No se puede iniciar el proyecto:\n\n${errorMessage}\n\nRequisitos:\n- El proyecto debe tener tareas asociadas\n- Todas las tareas deben estar asignadas a un desarrollador`);
          } else {
            alert(`❌ Error al iniciar el proyecto:\n\n${errorMessage}`);
          }
        }
      }
    },
    
    async pausarProyecto() {
      if (!this.project?._id) return;
      
      if (window.confirm('¿Estás seguro de que quieres pausar este proyecto?')) {
        try {
          await ProjectService.pausarProyecto(this.project._id);
          alert('✅ Proyecto pausado correctamente');
          await this.loadProject();
        } catch (error) {
          console.error('Error pausando proyecto:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          alert(`❌ Error al pausar el proyecto:\n\n${errorMessage}`);
        }
      }
    },
    
    async finalizarProyecto() {
      if (!this.project?._id) return;
      
      if (window.confirm('¿Estás seguro de que quieres finalizar este proyecto?')) {
        try {
          await ProjectService.finalizarProyecto(this.project._id);
          alert('✅ Proyecto finalizado correctamente');
          await this.loadProject();
        } catch (error) {
          console.error('Error finalizando proyecto:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
          
          if (error.response?.status === 400) {
            alert(`⚠️ No se puede finalizar el proyecto:\n\n${errorMessage}\n\nRequisitos:\n- Todas las tareas deben estar completadas`);
          } else {
            alert(`❌ Error al finalizar el proyecto:\n\n${errorMessage}`);
          }
        }
      }
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

.status-pending {
  background: #e2e3e5;
  color: #495057;
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

.tasks-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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
  
  .tasks-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .tasks-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }
  
  .tasks-actions .btn {
    width: 100%;
  }
}

/* Estilos para el tab de asignaciones */
.assignments-content {
  padding: 1rem 0;
}

.assignments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.assignments-header h3 {
  margin: 0;
  color: #495057;
}

.assignments-actions {
  display: flex;
  gap: 1rem;
}

.assignment-list {
  max-height: 600px;
  overflow-y: auto;
}

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

/* Responsive para asignaciones */
@media (max-width: 768px) {
  .assignments-header {
    flex-direction: column;
    gap: 1rem;
  }
  
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

/* Estilos para el modal de selección de tipo de asignación */
.assignment-type-modal {
  max-width: 800px;
}

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
