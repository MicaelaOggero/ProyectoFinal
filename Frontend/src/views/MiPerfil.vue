<template>
  <div class="container-fluid">
    <!-- Encabezado con botón de regreso -->
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3" @click="$router.go(-1)">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h1>Mi Perfil</h1>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary" @click="editProfile">
          <i class="bi bi-pencil me-2"></i>Editar Perfil
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando tu perfil...</p>
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
            <div class="d-flex align-items-center">
              <div class="user-avatar me-3">
                <i class="bi bi-person-circle"></i>
              </div>
              <div>
                <h3 class="mb-0">{{ user.nombre }} {{ user.apellido }}</h3>
                <p class="mb-0 opacity-75">{{ user.email }}</p>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6" v-if="user.rol !== 'admin'">
                <h5>Información Personal</h5>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <i class="bi bi-card-text me-2 text-muted"></i>
                    <strong>DNI:</strong> {{ user.dni || 'No especificado' }}
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-shield-check me-2 text-muted"></i>
                    <strong>Rol:</strong> 
                    <span class="badge" :class="getRoleClass(user.rol)">
                      {{ user.rol === 'admin' ? 'Administrador' : 'Desarrollador' }}
                    </span>
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-clock me-2 text-muted"></i>
                    <strong>Disponibilidad:</strong> {{ user.disponibilidadSemanal || 'No especificada' }} hs/semana
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-currency-dollar me-2 text-muted"></i>
                    <strong>Costo por Hora:</strong> ${{ user.costoPorHora || 'No especificado' }}
                  </li>
                  <li class="mb-2" v-if="user.aniosExperiencia">
                    <i class="bi bi-calendar-check me-2 text-muted"></i>
                    <strong>Experiencia:</strong> {{ user.aniosExperiencia }} años
                  </li>
                </ul>
              </div>
              <div class="col-md-6" v-if="user.rol !== 'admin'">
                <h5>Información del Sistema</h5>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <i class="bi bi-calendar-plus me-2 text-muted"></i>
                    <strong>Fecha de Registro:</strong> {{ formatDate(user.fechaCreacion) }}
                  </li>
                
                  <li class="mb-2" v-if="user.googleId">
                    <i class="bi bi-google me-2 text-muted"></i>
                    <strong>Registrado con:</strong> Google
                  </li>
                  <li class="mb-2" v-if="user.approved !== undefined">
                    <i class="bi bi-check-circle me-2 text-muted"></i>
                    <strong>Estado de Aprobación:</strong> 
                    <span class="badge" :class="user.approved ? 'bg-success' : 'bg-warning'">
                      {{ user.approved ? 'Aprobado' : 'Pendiente' }}
                    </span>
                  </li>
                </ul>
              </div>
              <!-- Información Personal para Administrador -->
              <div class="col-md-12" v-if="user.rol === 'admin'">
                <h5>Información Personal</h5>
                <ul class="list-unstyled">
                  <li class="mb-2">
                    <i class="bi bi-card-text me-2 text-muted"></i>
                    <strong>DNI:</strong> {{ user.dni || 'No especificado' }}
                  </li>
                  <li class="mb-2">
                    <i class="bi bi-shield-check me-2 text-muted"></i>
                    <strong>Rol:</strong> 
                    <span class="badge" :class="getRoleClass(user.rol)">
                      {{ user.rol === 'admin' ? 'Administrador' : 'Desarrollador' }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Habilidades -->
        <div v-if="user.rol !== 'admin'" class="card mb-4">
          <div class="card-header bg-success text-white">
            <h4 class="mb-0">
              <i class="bi bi-tools me-2"></i>
              Habilidades Técnicas
            </h4>
          </div>
          <div class="card-body">
            <div v-if="user.habilidades && user.habilidades.length > 0" class="row">
              <div v-for="(skill, index) in user.habilidades" :key="index" class="col-md-6 mb-3">
                <div class="card border-success h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <h6 class="card-title text-success mb-2">{{ skill.nombre }}</h6>
                      <span class="badge bg-success">{{ getNivelText(skill.nivel) }}</span>
                    </div>
                    <div class="skill-level-bar mb-2">
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" 
                             :style="{ width: (skill.nivel / 5) * 100 + '%' }"></div>
                      </div>
                      <small class="text-muted">Nivel {{ skill.nivel }}/5</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-tools" style="font-size: 3rem; opacity: 0.5;"></i>
              <p class="mt-2">No se han registrado habilidades técnicas.</p>
              <button class="btn btn-outline-success btn-sm" @click="editProfile">
                <i class="bi bi-plus-circle me-1"></i>Agregar Habilidades
              </button>
            </div>
          </div>
        </div>

        <!-- Preferencias -->
         <div v-if="user.preferencias && user.rol !== 'admin'" class="card mb-4">
          <div class="card-header bg-info text-white">
            <h4 class="mb-0">
              <i class="bi bi-heart me-2"></i>
              Preferencias de Trabajo
            </h4>
          </div>
          <div class="card-body">
            <p class="text-muted">{{ user.preferencias }}</p>
          </div>
        </div>

         <!-- Estadísticas -->
         <div class="card mb-4">
           <div class="card-header bg-primary text-white">
             <h4 class="mb-0">
               <i class="bi bi-graph-up me-2"></i>
               Estadísticas
             </h4>
           </div>
           <div class="card-body">
             <!-- Estadísticas para Usuarios Normales -->
             <div v-if="user.rol !== 'admin'" class="row text-center">
               <div class="col-md-4 mb-3">
                 <h3 class="text-success">{{ user.habilidades ? user.habilidades.length : 0 }}</h3>
                 <p class="text-muted mb-0">Habilidades</p>
               </div>
               <div class="col-md-4 mb-3">
                 <h3 class="text-info">{{ user.disponibilidadSemanal || 'N/A' }}</h3>
                 <p class="text-muted mb-0">Horas/Semana</p>
               </div>
               <div class="col-md-4 mb-3">
                 <h3 class="text-warning">${{ user.costoPorHora || 'N/A' }}</h3>
                 <p class="text-muted mb-0">Costo/Hora</p>
               </div>
             </div>
             <!-- Estadísticas para Administrador -->
             <div v-else class="row text-center">
               <div class="col-md-3 mb-3">
                 <h3 class="text-success">{{ projectStats.totalProyectos || 0 }}</h3>
                 <p class="text-muted mb-0">Total Proyectos</p>
               </div>
               <div class="col-md-3 mb-3">
                 <h3 class="text-info">{{ projectStats.proyectosActivos || 0 }}</h3>
                 <p class="text-muted mb-0">Proyectos Activos</p>
               </div>
               <div class="col-md-3 mb-3">
                 <h3 class="text-warning">{{ projectStats.proyectosPendientes || 0 }}</h3>
                 <p class="text-muted mb-0">Pendientes de Entrega</p>
               </div>
               <div class="col-md-3 mb-3">
                 <h3 class="text-danger">{{ projectStats.proyectosFinalizados || 0 }}</h3>
                 <p class="text-muted mb-0">Proyectos Finalizados</p>
               </div>
             </div>
           </div>
         </div>
      </div>

       <!-- Sidebar -->
      <div class="col-md-4">
        <!-- Estado de la Cuenta -->
        <div v-if="user.rol !== 'admin'" class="card mb-4">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Estado de la Cuenta
            </h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <div class="status-indicator" :class="getStatusClass(user.approved)">
                  <i :class="getStatusIcon(user.approved)"></i>
                </div>
                <h6 class="mt-2">{{ getStatusText(user.approved) }}</h6>
                <p class="text-muted small">{{ getStatusDescription(user.approved) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado de Administrador -->
        <div v-else class="card mb-4">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">
              <i class="bi bi-shield-check me-2"></i>
              Estado de Administrador
            </h5>
          </div>
          <div class="card-body">
            <div class="text-center">
              <div class="mb-3">
                <div class="status-indicator status-admin">
                  <i class="bi bi-shield-check"></i>
                </div>
                <h6 class="mt-2">Cuenta de Administrador</h6>
                <p class="text-muted small">Tienes acceso completo al sistema</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="card">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">
              <i class="bi bi-lightning me-2"></i>
              Acciones Rápidas
            </h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-outline-primary btn-sm" @click="editProfile">
                <i class="bi bi-pencil me-1"></i>Editar Perfil
              </button>
              <button class="btn btn-outline-success btn-sm" @click="goToProjects">
                <i class="bi bi-folder me-1"></i>Ver Mis Proyectos
              </button>
              <button class="btn btn-outline-info btn-sm" @click="goToTasks">
                <i class="bi bi-list-task me-1"></i>Ver Mis Tareas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Editar Mi Perfil</h5>
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
                    @input="validateDni"
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
import AuthService from '@/services/auth.service.js';
import ProjectService from '@/services/project.service.js';

export default {
  name: 'MiPerfilView',
  data() {
    return {
      user: null,
      loading: true,
      error: null,
      editModalInstance: null,
      editForm: {
        dni: '',
        aniosExperiencia: null,
        disponibilidadSemanal: null,
        costoPorHora: null,
        habilidades: [],
        preferencias: ''
      },
      saving: false,
      editMessage: '',
      editMessageClass: '',
      projectStats: {
        totalProyectos: 0,
        proyectosActivos: 0,
        proyectosPendientes: 0,
        proyectosFinalizados: 0
      }
    };
  },
  async mounted() {
    this.editModalInstance = new Modal(document.getElementById('editProfileModal'));
    this.initializeEditForm();
    await this.loadUserProfile();
  },
  methods: {
    initializeEditForm() {
      this.editForm = {
        dni: '',
        aniosExperiencia: 0,
        disponibilidadSemanal: 40,
        costoPorHora: 0,
        habilidades: [{ nombre: '', nivel: '' }],
        preferencias: ''
      };
    },
    
    async loadUserProfile() {
      this.loading = true;
      this.error = null;
      
      try {
        // Obtener el usuario actual de la sesión
        const currentUser = await AuthService.checkSession();
        if (currentUser) {
          // Ahora checkSession devuelve todos los campos del usuario
          this.user = currentUser;
          console.log('Usuario cargado completo:', this.user);
          
          // Si es administrador, cargar estadísticas de proyectos
          if (this.user.rol === 'admin') {
            await this.loadProjectStats();
          }
        } else {
          this.error = 'No se pudo cargar tu perfil. Por favor, inicia sesión nuevamente.';
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.error = 'No se pudo cargar tu perfil. Verifica tu conexión e intenta nuevamente.';
      } finally {
        this.loading = false;
      }
    },
    
    async loadProjectStats() {
      try {
        const projectsResponse = await ProjectService.getProjects();
        const projects = projectsResponse.data;
        
        this.projectStats = {
          totalProyectos: projects.length,
          proyectosActivos: projects.filter(p => p.estado === 'activo').length,
          proyectosPendientes: projects.filter(p => p.estado === 'pausado').length,
          proyectosFinalizados: projects.filter(p => p.estado === 'finalizado').length
        };
        
        console.log('Estadísticas de proyectos cargadas:', this.projectStats);
      } catch (error) {
        console.error('Error loading project stats:', error);
        // En caso de error, mantener valores por defecto
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
    getStatusClass(approved) {
      return approved ? 'status-approved' : 'status-pending';
    },
    getStatusIcon(approved) {
      return approved ? 'bi bi-check-circle-fill' : 'bi bi-clock-fill';
    },
    getStatusText(approved) {
      return approved ? 'Cuenta Aprobada' : 'Pendiente de Aprobación';
    },
    getStatusDescription(approved) {
      return approved 
        ? 'Tu cuenta está activa y puedes acceder a todos los proyectos'
        : 'Tu cuenta está siendo revisada por un administrador';
    },
    editProfile() {
      // Solo copiar los campos editables
      this.editForm = {
        dni: this.user.dni || '',
        aniosExperiencia: this.user.aniosExperiencia || 0,
        disponibilidadSemanal: this.user.disponibilidadSemanal || 40,
        costoPorHora: this.user.costoPorHora || 0,
        habilidades: this.user.habilidades ? [...this.user.habilidades] : [{ nombre: '', nivel: '' }],
        preferencias: this.user.preferencias || ''
      };
      
      // Asegurar que siempre haya al menos una habilidad
      if (this.editForm.habilidades.length === 0) {
        this.editForm.habilidades = [{ nombre: '', nivel: '' }];
      }
      
      this.editModalInstance.show();
    },
    closeEditModal() {
      this.editModalInstance.hide();
      this.editMessage = ''; // Limpiar mensaje de estado
      this.editMessageClass = ''; // Limpiar clase de mensaje
      this.initializeEditForm(); // Reinicializar formulario
    },
    addSkill() {
      this.editForm.habilidades.push({ nombre: '', nivel: '' });
    },
    
    removeSkill(index) {
      if (this.editForm.habilidades.length > 1) {
        this.editForm.habilidades.splice(index, 1);
      }
    },
    
    validateDni() {
      // Solo permitir números en el DNI
      this.editForm.dni = this.editForm.dni.replace(/\D/g, '');
      // Limitar a 8 dígitos
      if (this.editForm.dni.length > 8) {
        this.editForm.dni = this.editForm.dni.slice(0, 8);
      }
    },
    async saveProfile() {
      this.saving = true;
      this.editMessage = '';
      this.editMessageClass = '';

      try {
        // Validar campos requeridos
        if (!this.editForm.dni) {
          throw new Error('El DNI es obligatorio');
        }

        if (this.editForm.dni.length !== 8 || isNaN(this.editForm.dni)) {
          throw new Error('El DNI debe tener 8 dígitos numéricos');
        }

        if (this.editForm.habilidades.length === 0) {
          throw new Error('Debes agregar al menos una habilidad');
        }

        for (let skill of this.editForm.habilidades) {
          if (!skill.nombre || !skill.nivel) {
            throw new Error('Por favor completa todas las habilidades');
          }
        }

        const updatedUser = await AuthService.updateProfile(this.editForm);
        if (updatedUser) {
          // Recargar el perfil del usuario
          await this.loadUserProfile();
          
          this.editMessage = '¡Perfil actualizado exitosamente!';
          this.editMessageClass = 'alert-success';
          
          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            this.closeEditModal();
          }, 2000);
        } else {
          this.editMessage = 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
          this.editMessageClass = 'alert-danger';
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        this.editMessage = error.message || 'Error al guardar los cambios. Verifica tu conexión e intenta nuevamente.';
        this.editMessageClass = 'alert-danger';
      } finally {
        this.saving = false;
      }
    },
    goToProjects() {
      this.$router.push('/proyectos');
    },
    goToTasks() {
      this.$router.push('/tareas');
    }
  }
}
</script>

<style scoped>
.user-avatar {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.8);
}

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

.status-indicator {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2rem;
}

.status-approved {
  background-color: #d4edda;
  color: #155724;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-admin {
  background-color: #d1ecf1;
  color: #0c5460;
}

.skill-level-bar .progress {
  margin-bottom: 0.5rem;
}

.text-decoration-none:hover {
  text-decoration: underline !important;
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

code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85em;
}
</style>
