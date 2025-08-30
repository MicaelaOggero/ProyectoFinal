<template>
  <div class="container-fluid">
    <!-- Encabezado con botón de regreso -->
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3" @click="$router.go(-1)">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h1>Perfil de Usuario</h1>
      </div>
      <div v-if="canEditProfile" class="d-flex gap-2">
        <button class="btn btn-primary" @click="editProfile">Editar Perfil</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando perfil...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Error</h4>
      <p>{{ error }}</p>
      <button class="btn btn-outline-danger" @click="loadUserProfile">Reintentar</button>
    </div>

    <!-- Perfil del Usuario -->
    <div v-else-if="user" class="row">
      <!-- Información Principal -->
      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h3 class="mb-0">{{ user.nombre }} {{ user.apellido }}</h3>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h5>Información Personal</h5>
                <ul class="list-unstyled">
                  <li><strong>DNI:</strong> {{ user.dni }}</li>
                  <li><strong>Rol:</strong> 
                    <span class="badge" :class="getRoleClass(user.rol)">{{ user.rol }}</span>
                  </li>
                  <li><strong>Email:</strong> {{ user.email }}</li>
                  <li><strong>Años de Experiencia:</strong> {{ user.aniosExperiencia || 'No especificado' }}</li>
                  <li><strong>Disponibilidad:</strong> {{ user.disponibilidadSemanal }} hs/semana</li>
                  <li><strong>Costo por Hora:</strong> ${{ user.costoPorHora }}</li>
                </ul>
              </div>
              <div class="col-md-6">
                <h5>Información del Sistema</h5>
                <ul class="list-unstyled">
                  <li><strong>Fecha de Creación:</strong> {{ formatDate(user.fechaCreacion) }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Habilidades -->
        <div class="card mb-4">
          <div class="card-header bg-success text-white">
            <h4 class="mb-0">Habilidades Técnicas</h4>
          </div>
          <div class="card-body">
            <div v-if="user.habilidades && user.habilidades.length > 0" class="row">
              <div v-for="(skill, index) in user.habilidades" :key="index" class="col-md-6 mb-3">
                <div class="card border-success">
                  <div class="card-body">
                    <h6 class="card-title text-success">{{ skill.nombre }}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Nivel {{ skill.nivel }}/5</span>
                      <span class="badge bg-success">{{ getNivelText(skill.nivel) }}</span>
                    </div>
                    <div class="skill-level-bar mt-2">
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" 
                             :style="{ width: (skill.nivel / 5) * 100 + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <p>No se han registrado habilidades técnicas.</p>
            </div>
          </div>
        </div>

        <!-- Preferencias -->
        <div v-if="user.preferencias" class="card mb-4">
          <div class="card-header bg-info text-white">
            <h4 class="mb-0">Preferencias</h4>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6" v-if="user.preferencias.tipoTarea && user.preferencias.tipoTarea.length > 0">
                <h6>Tipo de Tareas Preferidas:</h6>
                <div class="d-flex flex-wrap gap-1">
                  <span v-for="tipo in user.preferencias.tipoTarea" :key="tipo" 
                        class="badge bg-secondary">{{ tipo }}</span>
                </div>
              </div>
              <div class="col-md-6" v-if="user.preferencias.tecnologias && user.preferencias.tecnologias.length > 0">
                <h6>Tecnologías Preferidas:</h6>
                <div class="d-flex flex-wrap gap-1">
                  <span v-for="tech in user.preferencias.tecnologias" :key="tech" 
                        class="badge bg-info">{{ tech }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar con Estadísticas -->
      <div class="col-md-4">
        <!-- Estadísticas Rápidas -->
        <div class="card mb-4">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0">Estadísticas</h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <h3 class="text-primary">{{ user.habilidades ? user.habilidades.length : 0 }}</h3>
                <p class="text-muted mb-0">Habilidades</p>
              </div>
              <div class="mb-3">
                <h3 class="text-success">{{ user.disponibilidadSemanal }}</h3>
                <p class="text-muted mb-0">Horas/Semana</p>
              </div>
              <div class="mb-3">
                <h3 class="text-warning">{{ user.aniosExperiencia || 'N/A' }}</h3>
                <p class="text-muted mb-0">Años Exp.</p>
              </div>
              <div>
                <h3 class="text-info">${{ user.costoPorHora }}</h3>
                <p class="text-muted mb-0">Costo/Hora</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial de Desempeño -->
        <div v-if="user.historialDesempeño && user.historialDesempeño.length > 0" class="card">
          <div class="card-header bg-dark text-white">
            <h5 class="mb-0">Historial de Desempeño</h5>
          </div>
          <div class="card-body">
            <div v-for="(historial, index) in user.historialDesempeño.slice(0, 3)" :key="index" class="mb-2">
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">Proyecto {{ index + 1 }}</small>
                <span class="badge" :class="getRatingClass(historial.calificacion)">
                  {{ historial.calificacion }}/5
                </span>
              </div>
              <div class="progress mt-1" style="height: 6px;">
                <div class="progress-bar" :class="getRatingClass(historial.calificacion)" 
                     :style="{ width: (historial.calificacion / 5) * 100 + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición (reutilizar el existente) -->
    <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Editar Perfil</h5>
            <button type="button" class="btn-close" @click="closeEditModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveProfile">
              <!-- Información Personal -->
              <div class="row mb-4">
                <div class="col-12">
                  <h6 class="text-primary mb-3">
                    <i class="bi bi-person me-2"></i>Información Personal
                  </h6>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="editDni" class="form-label">DNI *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="editDni" 
                    v-model="editForm.dni"
                    maxlength="8"
                    pattern="[0-9]{8}"
                    required
                  >
                  <div class="form-text">8 dígitos numéricos</div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="editAniosExperiencia" class="form-label">Años de Experiencia</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="editAniosExperiencia" 
                    v-model="editForm.aniosExperiencia"
                    min="0"
                    max="50"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="editDisponibilidadSemanal" class="form-label">Disponibilidad Semanal (horas)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="editDisponibilidadSemanal" 
                    v-model="editForm.disponibilidadSemanal"
                    min="1"
                    max="168"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="editCostoPorHora" class="form-label">Costo por Hora ($)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="editCostoPorHora" 
                    v-model="editForm.costoPorHora"
                    min="0"
                    step="0.01"
                  >
                </div>
              </div>

              <!-- Habilidades -->
              <div class="row mb-4">
                <div class="col-12">
                  <h6 class="text-success mb-3">
                    <i class="bi bi-tools me-2"></i>Habilidades Técnicas *
                  </h6>
                  <div v-for="(skill, index) in editForm.habilidades" :key="index" class="row mb-3">
                    <div class="col-md-5">
                      <input 
                        type="text" 
                        class="form-control" 
                        :placeholder="'Nombre de habilidad ' + (index + 1)"
                        v-model="skill.nombre"
                        required
                      >
                    </div>
                    <div class="col-md-4">
                      <select class="form-select" v-model="skill.nivel" required>
                        <option value="">Seleccionar nivel</option>
                        <option value="1">1 - Principiante</option>
                        <option value="2">2 - Básico</option>
                        <option value="3">3 - Intermedio</option>
                        <option value="4">4 - Avanzado</option>
                        <option value="5">5 - Experto</option>
                      </select>
                    </div>
                    <div class="col-md-3 d-flex align-items-center">
                      <button 
                        type="button" 
                        class="btn btn-outline-danger btn-sm me-2"
                        @click="removeSkill(index)"
                        :disabled="editForm.habilidades.length === 1"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                      <span class="badge bg-secondary">{{ skill.nivel || 'N/A' }}/5</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    class="btn btn-outline-success btn-sm"
                    @click="addSkill"
                  >
                    <i class="bi bi-plus-circle me-1"></i>Agregar Habilidad
                  </button>
                </div>
              </div>

              <!-- Preferencias -->
              <div class="row mb-4">
                <div class="col-12">
                  <h6 class="text-info mb-3">
                    <i class="bi bi-heart me-2"></i>Preferencias de Trabajo
                  </h6>
                  <textarea 
                    class="form-control" 
                    rows="3" 
                    placeholder="Describe tus preferencias de trabajo, tipo de proyectos que te gustan, etc."
                    v-model="editForm.preferencias"
                  ></textarea>
                </div>
              </div>

              <!-- Mensaje de estado -->
              <div v-if="editMessage" class="alert" :class="editMessageClass" role="alert">
                {{ editMessage }}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveProfile"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import UserService from '@/services/user.service.js';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'PerfilUsuarioView',
  data() {
    return {
      user: null,
      loading: true,
      error: null,
      editModalInstance: null,
      currentUser: null,
      editForm: {
        dni: '',
        aniosExperiencia: null,
        disponibilidadSemanal: null,
        costoPorHora: null,
        habilidades: [],
        preferencias: ''
      },
      editMessage: '',
      editMessageClass: '',
      saving: false
    };
  },
  computed: {
    isUserAdmin() {
      return AuthService.isAdmin(this.currentUser);
    },
    canEditProfile() {
      // Si no hay usuario logueado, no puede editar
      if (!this.currentUser) return false;
      
      // Si es administrador, puede editar cualquier perfil
      if (this.isUserAdmin) return true;
      
      // Si no es admin, solo puede editar su propio perfil
      return this.currentUser._id === this.$route.params.id;
    }
  },
  async mounted() {
    await this.checkUserSession();
    this.loadUserProfile();
    // Inicializar el modal después de que el DOM esté listo
    this.$nextTick(() => {
      const modalElement = document.getElementById('editProfileModal');
      if (modalElement) {
        this.editModalInstance = new Modal(modalElement);
      }
    });
  },
  methods: {
    async checkUserSession() {
      try {
        this.currentUser = await AuthService.checkSession();
      } catch (error) {
        console.error('Error verificando sesión:', error);
        this.currentUser = null;
      }
    },
    async loadUserProfile() {
      this.loading = true;
      this.error = null;
      
      try {
        const userId = this.$route.params.id;
        const response = await UserService.getUserById(userId);
        this.user = response.data;
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.error = 'No se pudo cargar el perfil del usuario. Verifica que el ID sea válido.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    getRoleClass(role) {
      return role === 'admin' ? 'bg-danger' : 'bg-primary';
    },
    getRatingClass(rating) {
      if (rating >= 4) return 'bg-success';
      if (rating >= 3) return 'bg-warning';
      return 'bg-danger';
    },
    getNivelText(nivel) {
      const niveles = {
        1: 'Principiante',
        2: 'Básico',
        3: 'Intermedio',
        4: 'Avanzado',
        5: 'Experto'
      };
      return niveles[nivel] || 'N/A';
    },
    editProfile() {
      // Cargar los datos actuales del usuario en el formulario
      this.editForm = {
        dni: this.user.dni || '',
        aniosExperiencia: this.user.aniosExperiencia || null,
        disponibilidadSemanal: this.user.disponibilidadSemanal || null,
        costoPorHora: this.user.costoPorHora || null,
        habilidades: this.user.habilidades ? [...this.user.habilidades] : [{ nombre: '', nivel: '' }],
        preferencias: this.user.preferencias || ''
      };
      this.editMessage = '';
      
      // Verificar que el modal esté inicializado antes de mostrarlo
      if (this.editModalInstance) {
        this.editModalInstance.show();
      } else {
        // Intentar inicializar el modal si no está disponible
        this.initModal();
        // Esperar un poco y luego intentar mostrar el modal
        setTimeout(() => {
          if (this.editModalInstance) {
            this.editModalInstance.show();
          } else {
            console.error('No se pudo inicializar el modal');
          }
        }, 100);
      }
    },
    closeEditModal() {
      if (this.editModalInstance) {
        this.editModalInstance.hide();
      }
      this.editMessage = '';
    },
    addSkill() {
      this.editForm.habilidades.push({ nombre: '', nivel: '' });
    },
    removeSkill(index) {
      if (this.editForm.habilidades.length > 1) {
        this.editForm.habilidades.splice(index, 1);
      }
    },
    async saveProfile() {
      this.saving = true;
      this.editMessage = '';
      
      try {
        // Validar que al menos una habilidad tenga nombre y nivel
        const validSkills = this.editForm.habilidades.filter(skill => 
          skill.nombre.trim() && skill.nivel
        );
        
        if (validSkills.length === 0) {
          this.editMessage = 'Debes agregar al menos una habilidad técnica.';
          this.editMessageClass = 'alert-danger';
          return;
        }
        
        // Preparar datos para enviar al backend
        const userData = {
          dni: this.editForm.dni,
          aniosExperiencia: this.editForm.aniosExperiencia,
          disponibilidadSemanal: this.editForm.disponibilidadSemanal,
          costoPorHora: this.editForm.costoPorHora,
          habilidades: validSkills,
          preferencias: this.editForm.preferencias
        };
        
        // Actualizar el usuario
        const userId = this.$route.params.id;
        await UserService.updateUser(userId, userData);
        
        // Actualizar el perfil local
        this.user = { ...this.user, ...userData };
        
        this.editMessage = 'Perfil actualizado correctamente.';
        this.editMessageClass = 'alert-success';
        
        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
          this.closeEditModal();
        }, 2000);
        
      } catch (error) {
        console.error('Error updating profile:', error);
        this.editMessage = 'Error al actualizar el perfil. Intenta nuevamente.';
        this.editMessageClass = 'alert-danger';
      } finally {
        this.saving = false;
      }
    },
    
    // Método para reinicializar el modal si es necesario
    initModal() {
      if (!this.editModalInstance) {
        this.$nextTick(() => {
          const modalElement = document.getElementById('editProfileModal');
          if (modalElement) {
            this.editModalInstance = new Modal(modalElement);
          }
        });
      }
    }
  }
}
</script>

<style scoped>
.card-header {
  border-bottom: none;
}

.badge {
  font-size: 0.9em;
}

.progress {
  background-color: #e9ecef;
}

.progress-bar {
  transition: width 0.6s ease;
}

.text-decoration-none:hover {
  text-decoration: underline !important;
}

.skill-level-bar .progress {
  margin-bottom: 0.5rem;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: none;
  border-radius: 8px;
}

.card-header {
  border-radius: 8px 8px 0 0 !important;
}

.list-unstyled li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.list-unstyled li:last-child {
  border-bottom: none;
}
</style> 