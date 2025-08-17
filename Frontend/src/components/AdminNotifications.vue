<template>
  <div class="modal fade" id="adminNotificationsModal" tabindex="-1" aria-labelledby="adminNotificationsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="adminNotificationsModalLabel">
            <i class="bi bi-bell me-2"></i>
            Solicitudes de Usuarios Pendientes
          </h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
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
                        <li><strong>Disponibilidad:</strong> {{ user.disponibilidadSemanal }}h/semana</li>
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
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'AdminNotifications',
  data() {
    return {
      modalInstance: null,
      pendingUsers: [],
      loading: true,
      processingUser: null
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('adminNotificationsModal'));
  },
  methods: {
    async show() {
      this.loading = true;
      this.pendingUsers = [];
      this.modalInstance.show();
      await this.loadPendingUsers();
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
            disponibilidadSemanal: 40,
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
            disponibilidadSemanal: 30,
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
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.modal-xl {
  max-width: 1200px;
}

.users-list {
  max-height: 600px;
  overflow-y: auto;
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
