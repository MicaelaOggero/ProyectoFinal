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
          <div class="notif-tabs mb-3">
            <button
              v-for="tab in availableTabs"
              :key="tab.key"
              type="button"
              class="notif-tab-btn"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <!-- Vista para desarrolladores -->
          <div v-if="!isAdmin">
            <div v-if="loadingDeveloperNotifications" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2">Cargando notificaciones...</p>
            </div>
            <div v-else-if="filteredDeveloperNotifications.length === 0" class="text-center py-4">
              <div class="empty-state">
                <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3">No tenés notificaciones</h5>
                <p class="text-muted">Cuando te asignen tareas, haya retrasos o recibas calificaciones, aparecerán aquí.</p>
              </div>
            </div>
            <div v-else class="developer-notifications-list">
              <div v-for="notif in filteredDeveloperNotifications" :key="notif._id" class="task-notif-card card mb-3">
                <div class="card-body">
                  <div class="d-flex align-items-start">
                    <i :class="notificationIconClass(notif)" class="me-3 mt-1" style="font-size: 1.5rem;"></i>
                    <div>
                      <h6 class="card-title mb-1">{{ notif.titulo }}</h6>
                      <span class="badge bg-light text-dark border mb-2">{{ notificationTypeLabel(notif.tipo) }}</span>
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

          <!-- Vista para administradores: solo tareas/proyectos pendientes de calificar -->
          <template v-if="isAdmin">
          <div>
            <div v-if="loadingTaskNotifications" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2">Cargando notificaciones...</p>
            </div>
            <div v-else-if="filteredAdminRatingNotifications.length === 0 && filteredAdminDelayNotifications.length === 0" class="text-center py-4">
              <div class="empty-state">
                <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3">No hay notificaciones pendientes</h5>
                <p class="text-muted">Vas a ver aquí tareas/proyectos para calificar y alertas por retrasos.</p>
              </div>
            </div>
            <div v-else class="task-notifications-list">
              <!-- Notificación: tarea completada (una sola calificación) -->
              <div v-for="notif in filteredAdminRatingNotifications" :key="notif._id" class="task-notif-card card mb-3" v-show="notif.tipo === 'CALIFICAR_TAREA'">
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
              <div v-for="notif in filteredAdminRatingNotifications" :key="'proj-' + notif._id" class="task-notif-card card mb-3" v-show="notif.tipo === 'CALIFICAR_PROYECTO_LOTE'">
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
              <!-- Notificación: alerta de retraso -->
              <div v-for="notif in filteredAdminDelayNotifications" :key="'delay-' + notif._id" class="task-notif-card card mb-3">
                <div class="card-body">
                  <div class="d-flex align-items-start">
                    <i class="bi bi-exclamation-triangle-fill text-warning me-3 mt-1" style="font-size: 1.4rem;"></i>
                    <div>
                      <h6 class="card-title mb-1">{{ notif.titulo }}</h6>
                      <span class="badge bg-warning text-dark mb-2">Tarea retrasada</span>
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
      taskNotifications: [],
      loadingTaskNotifications: false,
      developerNotifications: [],
      loadingDeveloperNotifications: false,
      activeTab: 'todas',
      calificandoId: null,
      puntuacionSeleccionada: null,
      calificandoProyectoId: null,
      puntuacionesProyecto: {} // { [notificationId]: { [desarrolladorId]: number | null } }
    };
  },
  computed: {
    isAdmin() {
      return AuthService.isAdmin(this.currentUser);
    },
    availableTabs() {
      if (this.isAdmin) {
        return [
          { key: 'todas', label: 'Todas' },
          { key: 'calificaciones', label: 'Calificaciones' },
          { key: 'retrasos', label: 'Retrasos' }
        ];
      }
      return [
        { key: 'todas', label: 'Todas' },
        { key: 'calificaciones', label: 'Calificaciones' },
        { key: 'retrasos', label: 'Retrasos' },
        { key: 'asignaciones', label: 'Asignaciones' }
      ];
    },
    adminRatingNotifications() {
      return this.taskNotifications.filter(
        n => n.tipo === 'CALIFICAR_TAREA' || n.tipo === 'CALIFICAR_PROYECTO_LOTE'
      );
    },
    adminDelayNotifications() {
      return this.taskNotifications.filter(n => n.tipo === 'RETRASO_TAREA');
    },
    filteredAdminRatingNotifications() {
      if (this.activeTab === 'retrasos') return [];
      if (this.activeTab === 'calificaciones' || this.activeTab === 'todas') {
        return this.adminRatingNotifications;
      }
      return [];
    },
    filteredAdminDelayNotifications() {
      if (this.activeTab === 'calificaciones') return [];
      if (this.activeTab === 'retrasos' || this.activeTab === 'todas') {
        return this.adminDelayNotifications;
      }
      return [];
    },
    filteredDeveloperNotifications() {
      if (this.activeTab === 'todas') return this.developerNotifications;

      if (this.activeTab === 'calificaciones') {
        return this.developerNotifications.filter(
          n => n.tipo === 'CALIFICACION_RECIBIDA' || n.tipo === 'TAREA_CALIFICADA' || n.tipo === 'PROYECTO_CALIFICADO'
        );
      }

      if (this.activeTab === 'retrasos') {
        return this.developerNotifications.filter(n => n.tipo === 'RETRASO_TAREA');
      }

      if (this.activeTab === 'asignaciones') {
        return this.developerNotifications.filter(n => n.tipo === 'TAREA_ASIGNADA');
      }

      return this.developerNotifications;
    }
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('adminNotificationsModal'));
  },
  methods: {
    async show() {
      this.currentUser = await AuthService.checkSession();
      this.activeTab = 'todas';
      this.modalInstance.show();
      if (AuthService.isAdmin(this.currentUser)) {
        this.taskNotifications = [];
        await this.loadTaskNotifications();
      } else {
        await this.loadDeveloperNotifications();
      }
    },
    closeModal() {
      this.modalInstance.hide();
      this.$emit('closed');
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
        // Notificaciones para desarrolladores.
        this.developerNotifications = todas.filter(
          n =>
            n.tipo === 'CALIFICACION_RECIBIDA' ||
            n.tipo === 'TAREA_CALIFICADA' ||
            n.tipo === 'PROYECTO_CALIFICADO' ||
            n.tipo === 'RETRASO_TAREA' ||
            n.tipo === 'TAREA_ASIGNADA'
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
        // Notificaciones admin: pendientes de calificar + alertas de retraso.
        const todas = Array.isArray(list) ? list : [];
        this.taskNotifications = todas.filter(
          n =>
            (n.tipo === 'CALIFICAR_TAREA' || n.tipo === 'CALIFICAR_PROYECTO_LOTE') && !n.resuelta ||
            n.tipo === 'RETRASO_TAREA'
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
    },
    notificationTypeLabel(tipo) {
      const map = {
        CALIFICACION_RECIBIDA: 'Calificación recibida',
        TAREA_ASIGNADA: 'Nueva tarea',
        RETRASO_TAREA: 'Tarea retrasada',
        TAREA_CALIFICADA: 'Tarea calificada',
        PROYECTO_CALIFICADO: 'Proyecto calificado'
      };
      return map[tipo] || tipo;
    },
    notificationIconClass(notif) {
      if (notif.tipo === 'RETRASO_TAREA') return 'bi bi-exclamation-triangle-fill text-warning';
      if (notif.tipo === 'TAREA_ASIGNADA') return 'bi bi-list-check text-primary';
      return 'bi bi-star-fill text-info';
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

.notif-tabs {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid #dbe4f0;
  border-radius: 0.7rem;
  padding: 0.25rem;
  background: #f8fbff;
}

.notif-tab-btn {
  border: none;
  background: transparent;
  color: #495057;
  font-weight: 600;
  font-size: 0.92rem;
  line-height: 1;
  padding: 0.55rem 0.9rem;
  border-radius: 0.5rem;
  transition: all 0.18s ease;
}

.notif-tab-btn:hover {
  background: #eef4fb;
  color: #0d6efd;
}

.notif-tab-btn.active {
  background: #ffffff;
  color: #0d6efd;
  border: 1px solid #0d6efd;
  box-shadow: 0 1px 2px rgba(13, 110, 253, 0.15);
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
