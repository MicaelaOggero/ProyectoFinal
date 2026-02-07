<template>
  <Teleport to="body">
  <div class="modal fade" id="adminNotificationsModal" tabindex="-1" aria-labelledby="adminNotificationsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="adminNotificationsModalLabel">
            <i class="bi bi-bell me-2"></i>
            Notificaciones
          </h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Vista para desarrolladores -->
          <div v-if="!isAdmin">
            <div v-if="loadingDeveloperNotifications" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2">Cargando notificaciones...</p>
            </div>
            <div v-else-if="developerNotifications.length === 0" class="text-center py-4">
              <div class="empty-state">
                <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3">No tenés notificaciones</h5>
                <p class="text-muted">Cuando te califiquen una tarea o un proyecto, aparecerá aquí.</p>
              </div>
            </div>
            <div v-else class="developer-notifications-list">
              <div v-for="notif in developerNotifications" :key="notif._id" class="task-notif-card card mb-3">
                <div class="card-body">
                  <div class="d-flex align-items-start">
                    <i class="bi bi-star-fill text-info me-3 mt-1" style="font-size: 1.5rem;"></i>
                    <div>
                      <h6 class="card-title mb-1">{{ notif.titulo }}</h6>
                      <p class="card-text text-muted small mb-1">{{ notif.mensaje }}</p>
                      <small v-if="notif.creadaEn" class="text-muted">
                        <i class="bi bi-clock me-1"></i>{{ formatDate(notif.creadaEn) }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista para administradores -->
          <template v-if="isAdmin">
          <!-- Tabs -->
          <ul class="nav nav-tabs mb-3" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'solicitudes' }"
                type="button"
                @click="activeTab = 'solicitudes'"
              >
                <i class="bi bi-person-plus me-1"></i> Solicitudes de usuarios
                <span v-if="pendingUsers.length > 0" class="badge bg-primary ms-1">{{ pendingUsers.length }}</span>
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'tareas' }"
                type="button"
                @click="activeTab = 'tareas'; loadTaskNotifications()"
              >
                <i class="bi bi-check2-square me-1"></i> Tareas completadas (calificar)
                <span v-if="taskNotifications.length > 0" class="badge bg-warning text-dark ms-1">{{ taskNotifications.length }}</span>
              </button>
            </li>
          </ul>

          <!-- Tab: Solicitudes de usuarios -->
          <div v-show="activeTab === 'solicitudes'">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando solicitudes...</p>
          </div>

          <div v-else-if="pendingUsers.length === 0" class="text-center py-4">
            <div class="empty-state">
              <i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
              <h5 class="mt-3">No hay solicitudes pendientes</h5>
              <p class="text-muted">Todos los usuarios han sido procesados.</p>
            </div>
          </div>

          <div v-else>
            <div class="alert alert-info" role="alert">
              <i class="bi bi-info-circle me-2"></i>
              <strong>{{ pendingUsers.length }}</strong> usuario(s) esperando tu aprobación para unirse al sistema.
            </div>

            <div class="users-list">
              <div v-for="user in pendingUsers" :key="user._id" class="user-card">
                <div class="user-header">
                  <div class="user-info">
                    <div class="user-avatar">
                      <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="user-details">
                      <h6 class="user-name">{{ user.nombre }} {{ user.apellido }}</h6>
                      <p class="user-email">{{ user.email }}</p>
                      <div class="user-meta">
                        <span class="badge bg-primary me-2">{{ user.rol === 'user' ? 'Desarrollador' : 'Administrador' }}</span>
                        <span class="badge bg-secondary">DNI: {{ user.dni }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="user-actions">
                    <button 
                      @click="approveUser(user._id)" 
                      class="btn btn-success btn-sm me-2"
                      :disabled="processingUser === user._id"
                    >
                      <i class="bi bi-check-circle me-1"></i>
                      Aprobar
                    </button>
                    <button 
                      @click="rejectUser(user._id)" 
                      class="btn btn-danger btn-sm"
                      :disabled="processingUser === user._id"
                    >
                      <i class="bi bi-x-circle me-1"></i>
                      Rechazar
                    </button>
                  </div>
                </div>

                <div class="user-details-expanded">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>Información Profesional</h6>
                      <ul class="list-unstyled">
                        <li><strong>Años de Experiencia:</strong> {{ user.aniosExperiencia }}</li>
                        <li><strong>Disponibilidad:</strong> {{ user.horasSemanalMaxima }}h/semana</li>
                        <li><strong>Costo por Hora:</strong> ${{ user.costoPorHora }}</li>
                      </ul>
                    </div>
                    <div class="col-md-6">
                      <h6>Habilidades</h6>
                      <div class="skills-list">
                        <span 
                          v-for="skill in user.habilidades" 
                          :key="skill.nombre"
                          class="badge bg-light text-dark me-1 mb-1"
                        >
                          {{ skill.nombre }} (Nivel {{ skill.nivel }})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="user.preferencias" class="mt-3">
                    <h6>Preferencias de Trabajo</h6>
                    <p class="text-muted">{{ user.preferencias }}</p>
                  </div>

                  <div class="mt-3">
                    <small class="text-muted">
                      <i class="bi bi-clock me-1"></i>
                      Solicitud recibida: {{ formatDate(user.fechaCreacion) }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <!-- Tab: Tareas completadas para calificar -->
          <div v-show="activeTab === 'tareas'">
            <div v-if="loadingTaskNotifications" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2">Cargando notificaciones...</p>
            </div>
            <div v-else-if="taskNotifications.length === 0" class="text-center py-4">
              <div class="empty-state">
                <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3">No hay tareas ni proyectos pendientes de calificar</h5>
                <p class="text-muted">Cuando un desarrollador complete una tarea o finalices un proyecto, aparecerá aquí para que asignes una puntuación de calidad (1 a 5).</p>
              </div>
            </div>
            <div v-else class="task-notifications-list">
              <!-- Notificación: tarea completada (una sola calificación) -->
              <div v-for="notif in taskNotifications" :key="notif._id" class="task-notif-card card mb-3" v-show="notif.tipo === 'CALIFICAR_TAREA'">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="card-title mb-1">{{ notif.titulo }}</h6>
                      <p class="card-text text-muted small mb-0">{{ notif.mensaje }}</p>
                      <small v-if="notif.creadaEn" class="text-muted">
                        <i class="bi bi-clock me-1"></i>{{ formatDate(notif.creadaEn) }}
                      </small>
                    </div>
                    <div v-if="calificandoId !== notif._id" class="ms-2">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        @click="abrirCalificar(notif)"
                        :disabled="calificandoId !== null"
                      >
                        <i class="bi bi-star me-1"></i> Calificar
                      </button>
                    </div>
                  </div>
                  <div v-if="calificandoId === notif._id" class="mt-3 pt-3 border-top calificar-form">
                    <label class="form-label">Puntuación de calidad (1 a 5)</label>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <select v-model.number="puntuacionSeleccionada" class="form-select form-select-sm" style="width: auto;">
                        <option :value="null" disabled>Seleccionar</option>
                        <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                      </select>
                      <button
                        type="button"
                        class="btn btn-success btn-sm"
                        @click="enviarCalificacion(notif)"
                        :disabled="puntuacionSeleccionada === null"
                      >
                        Enviar calificación
                      </button>
                      <button type="button" class="btn btn-outline-secondary btn-sm" @click="cancelarCalificar">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Notificación: proyecto finalizado (calificar a cada desarrollador) -->
              <div v-for="notif in taskNotifications" :key="'proj-' + notif._id" class="task-notif-card card mb-3" v-show="notif.tipo === 'CALIFICAR_PROYECTO_LOTE'">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="card-title mb-1">{{ notif.titulo }}</h6>
                      <p class="card-text text-muted small mb-0">{{ notif.mensaje }}</p>
                      <small v-if="notif.creadaEn" class="text-muted">
                        <i class="bi bi-clock me-1"></i>{{ formatDate(notif.creadaEn) }}
                      </small>
                    </div>
                    <div v-if="calificandoProyectoId !== notif._id" class="ms-2">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        @click="abrirCalificarProyecto(notif)"
                        :disabled="calificandoProyectoId !== null"
                      >
                        <i class="bi bi-people me-1"></i> Calificar equipo
                      </button>
                    </div>
                  </div>
                  <div v-if="calificandoProyectoId === notif._id && notif.data && notif.data.desarrolladores" class="mt-3 pt-3 border-top calificar-form">
                    <label class="form-label d-block">Puntuación de calidad (1 a 5) por desarrollador</label>
                    <div class="table-responsive">
                      <table class="table table-sm">
                        <thead>
                          <tr>
                            <th>Desarrollador</th>
                            <th>Puntuación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="d in notif.data.desarrolladores" :key="d.desarrolladorId">
                            <td>
                              <span v-if="d.nombre">{{ d.nombre }} {{ d.apellido || '' }}</span>
                              <span v-else class="text-muted">ID: {{ String(d.desarrolladorId).slice(-6) }}</span>
                            </td>
                            <td>
                              <select
                                v-model.number="puntuacionesProyecto[notif._id][String(d.desarrolladorId)]"
                                class="form-select form-select-sm"
                                style="width: auto;"
                              >
                                <option :value="null" disabled>Seleccionar</option>
                                <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                              </select>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        class="btn btn-success btn-sm"
                        @click="enviarCalificacionesProyecto(notif)"
                        :disabled="!todasPuntuacionesProyectoCompletas(notif)"
                      >
                        Enviar calificaciones
                      </button>
                      <button type="button" class="btn btn-outline-secondary btn-sm" @click="cancelarCalificarProyecto">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </template>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script>
import { Modal } from 'bootstrap';
import AuthService from '@/services/auth.service.js';
import NotificationService from '@/services/notification.service.js';
import ProjectService from '@/services/project.service.js';

export default {
  name: 'AdminNotifications',
  data() {
    return {
      modalInstance: null,
      currentUser: null,
      activeTab: 'solicitudes',
      pendingUsers: [],
      loading: true,
      processingUser: null,
      taskNotifications: [],
      loadingTaskNotifications: false,
      developerNotifications: [],
      loadingDeveloperNotifications: false,
      calificandoId: null,
      puntuacionSeleccionada: null,
      calificandoProyectoId: null,
      puntuacionesProyecto: {} // { [notificationId]: { [desarrolladorId]: number | null } }
    };
  },
  computed: {
    isAdmin() {
      return AuthService.isAdmin(this.currentUser);
    }
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('adminNotificationsModal'));
  },
  methods: {
    async show() {
      this.currentUser = await AuthService.checkSession();
      this.modalInstance.show();
      if (AuthService.isAdmin(this.currentUser)) {
        this.loading = true;
        this.pendingUsers = [];
        this.taskNotifications = [];
        this.activeTab = 'solicitudes';
        await this.loadPendingUsers();
        await this.loadTaskNotifications();
      } else {
        await this.loadDeveloperNotifications();
      }
    },
    closeModal() {
      this.modalInstance.hide();
    },
    async loadPendingUsers() {
      try {
        // Aquí deberías llamar al backend para obtener usuarios pendientes
        // Por ahora usamos datos de ejemplo
        this.pendingUsers = [
          {
            _id: '1',
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan.perez@email.com',
            dni: '12345678',
            rol: 'user',
            aniosExperiencia: 3,
            horasSemanalMaxima: 40,
            costoPorHora: 25,
            habilidades: [
              { nombre: 'JavaScript', nivel: 4 },
              { nombre: 'React', nivel: 3 },
              { nombre: 'Node.js', nivel: 3 }
            ],
            preferencias: 'Me gusta trabajar en proyectos de frontend y backend, especialmente con tecnologías modernas.',
            fechaCreacion: new Date()
          },
          {
            _id: '2',
            nombre: 'María',
            apellido: 'García',
            email: 'maria.garcia@email.com',
            dni: '87654321',
            rol: 'user',
            aniosExperiencia: 5,
            horasSemanalMaxima: 30,
            costoPorHora: 35,
            habilidades: [
              { nombre: 'Python', nivel: 5 },
              { nombre: 'Django', nivel: 4 },
              { nombre: 'PostgreSQL', nivel: 4 }
            ],
            preferencias: 'Especializada en desarrollo backend con Python y bases de datos.',
            fechaCreacion: new Date(Date.now() - 86400000) // 1 día atrás
          }
        ];
      } catch (error) {
        console.error('Error cargando usuarios pendientes:', error);
      } finally {
        this.loading = false;
      }
    },
    async approveUser(userId) {
      this.processingUser = userId;
      try {
        // Aquí deberías llamar al backend para aprobar al usuario
        await AuthService.approveUser(userId);
        
        // Remover usuario de la lista
        this.pendingUsers = this.pendingUsers.filter(user => user._id !== userId);
        
        // Mostrar mensaje de éxito
        this.$emit('user-approved', userId);
        
      } catch (error) {
        console.error('Error aprobando usuario:', error);
        alert('Error al aprobar usuario: ' + error.message);
      } finally {
        this.processingUser = null;
      }
    },
    async rejectUser(userId) {
      this.processingUser = userId;
      try {
        // Aquí deberías llamar al backend para rechazar al usuario
        await AuthService.rejectUser(userId);
        
        // Remover usuario de la lista
        this.pendingUsers = this.pendingUsers.filter(user => user._id !== userId);
        
        // Mostrar mensaje de éxito
        this.$emit('user-rejected', userId);
        
      } catch (error) {
        console.error('Error rechazando usuario:', error);
        alert('Error al rechazar usuario: ' + error.message);
      } finally {
        this.processingUser = null;
      }
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    async loadDeveloperNotifications() {
      this.loadingDeveloperNotifications = true;
      try {
        const list = await NotificationService.getMisNotificaciones();
        const todas = Array.isArray(list) ? list : [];
        // Notificaciones para desarrolladores: TAREA_CALIFICADA, PROYECTO_CALIFICADO, etc.
        this.developerNotifications = todas.filter(
          n => n.tipo === 'TAREA_CALIFICADA' || n.tipo === 'PROYECTO_CALIFICADO'
        );
      } catch (error) {
        console.error('Error cargando notificaciones del desarrollador:', error);
        this.developerNotifications = [];
      } finally {
        this.loadingDeveloperNotifications = false;
      }
    },
    async loadTaskNotifications() {
      this.loadingTaskNotifications = true;
      try {
        const list = await NotificationService.getMisNotificaciones();
        // Mostrar solo las pendientes de calificar (resuelta: false)
        const todas = Array.isArray(list) ? list : [];
        this.taskNotifications = todas.filter(
          n => !n.resuelta && (n.tipo === 'CALIFICAR_TAREA' || n.tipo === 'CALIFICAR_PROYECTO_LOTE')
        );
      } catch (error) {
        console.error('Error cargando notificaciones de tareas:', error);
        this.taskNotifications = [];
      } finally {
        this.loadingTaskNotifications = false;
      }
    },
    abrirCalificar(notif) {
      this.calificandoId = notif._id;
      this.puntuacionSeleccionada = null;
    },
    cancelarCalificar() {
      this.calificandoId = null;
      this.puntuacionSeleccionada = null;
    },
    abrirCalificarProyecto(notif) {
      const devs = notif.data?.desarrolladores || [];
      this.calificandoProyectoId = notif._id;
      this.puntuacionesProyecto = {
        ...this.puntuacionesProyecto,
        [notif._id]: Object.fromEntries(devs.map(d => [String(d.desarrolladorId), d.puntuacion ?? null]))
      };
    },
    cancelarCalificarProyecto() {
      this.calificandoProyectoId = null;
    },
    todasPuntuacionesProyectoCompletas(notif) {
      const map = this.puntuacionesProyecto[notif._id];
      if (!map || !notif.data?.desarrolladores?.length) return false;
      return notif.data.desarrolladores.every(d => {
        const p = map[String(d.desarrolladorId)];
        return p != null && p >= 1 && p <= 5;
      });
    },
    async enviarCalificacionesProyecto(notif) {
      const map = this.puntuacionesProyecto[notif._id];
      if (!map || !notif.data?.desarrolladores?.length) return;
      const calificaciones = notif.data.desarrolladores
        .filter(d => {
          const p = map[String(d.desarrolladorId)];
          return p != null && p >= 1 && p <= 5;
        })
        .map(d => ({ desarrolladorId: d.desarrolladorId, puntuacion: map[String(d.desarrolladorId)] }));
      if (calificaciones.length === 0) {
        alert('Asigná al menos una puntuación (1 a 5) a cada desarrollador.');
        return;
      }
      const projectId = notif.proyecto?._id || notif.proyecto || notif.data?.proyectoId;
      if (!projectId) {
        alert('Error: no se encontró el ID del proyecto.');
        return;
      }
      try {
        await ProjectService.enviarFeedbackProyecto(projectId, {
          calificaciones,
          notificationId: notif._id
        });
        this.taskNotifications = this.taskNotifications.filter(n => n._id !== notif._id);
        this.calificandoProyectoId = null;
        this.$emit('proyecto-calificado', notif);
        alert('Calificaciones del proyecto guardadas correctamente.');
      } catch (error) {
        const msg = error.response?.data?.error || error.message || 'Error al enviar calificaciones';
        alert('Error: ' + msg);
      }
    },
    async enviarCalificacion(notif) {
      if (this.puntuacionSeleccionada === null || this.puntuacionSeleccionada < 1 || this.puntuacionSeleccionada > 5) {
        alert('Seleccioná una puntuación entre 1 y 5.');
        return;
      }
      try {
        await NotificationService.calificarTareaDesdeNotificacion(notif._id, this.puntuacionSeleccionada);
        this.taskNotifications = this.taskNotifications.filter(n => n._id !== notif._id);
        this.calificandoId = null;
        this.puntuacionSeleccionada = null;
        this.$emit('tarea-calificada', notif);
        alert('Calificación guardada correctamente. El desarrollador podrá verla en su historial.');
      } catch (error) {
        const msg = error.response?.data?.error || error.message || 'Error al calificar';
        alert('Error: ' + msg);
      }
    }
  }
};
</script>

<style scoped>
/* Modal renderizado con Teleport a body para evitar conflicto de z-index con el navbar */
.modal-xl {
  max-width: 1200px;
}
</style>
<style>
/* Sin scoped: el modal se renderiza en body vía Teleport; debe quedar por encima del navbar (z-index 1000) */
#adminNotificationsModal.modal {
  z-index: 1060;
}
</style>
<style scoped>

.users-list {
  max-height: 600px;
  overflow-y: auto;
}

.task-notifications-list,
.developer-notifications-list {
  max-height: 500px;
  overflow-y: auto;
}

.task-notif-card .calificar-form {
  background: #f8f9fa;
  border-radius: 0.25rem;
}

.user-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.user-header {
  background: #f8f9fa;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  font-size: 2.5rem;
  color: #6c757d;
  margin-right: 1rem;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0;
  color: #333;
}

.user-email {
  margin: 0.25rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.user-meta {
  margin-top: 0.5rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.user-details-expanded {
  padding: 1rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.empty-state {
  color: #6c757d;
}

.empty-state i {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .user-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
