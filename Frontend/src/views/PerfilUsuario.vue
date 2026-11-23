<template>
  <div class="profile-page">
    <nav class="profile-breadcrumb" aria-label="Ruta de navegación">
      <button type="button" @click="$router.go(-1)"><i class="bi bi-arrow-left" aria-hidden="true"></i> Volver</button>
      <span aria-hidden="true">/</span><span>Perfil del usuario</span>
    </nav>
    <div v-if="loading" class="profile-panel profile-state" role="status">
      <div class="spinner-border text-primary" aria-hidden="true"></div><p>Cargando perfil...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <h1 class="h5">No pudimos cargar el perfil</h1><p>{{ error }}</p>
      <button class="btn btn-outline-danger" @click="loadUserProfile">Reintentar</button>
    </div>
    <template v-else-if="user">
      <header class="profile-hero profile-panel">
        <div class="profile-identity">
          <div class="profile-avatar" aria-hidden="true">{{ userInitials }}</div>
          <div class="profile-identity-text">
            <span class="profile-eyebrow">PERFIL DEL EQUIPO</span>
            <h1>{{ user.nombre }} {{ user.apellido }}</h1>
            <div class="profile-identity-meta">
              <span class="profile-role"><i class="bi bi-person-badge" aria-hidden="true"></i> {{ user.rol === 'admin' ? 'Administrador' : 'Desarrollador' }}</span>
              <span class="profile-email"><i class="bi bi-envelope" aria-hidden="true"></i> {{ user.email || 'Email no registrado' }}</span>
            </div>
          </div>
        </div>
        <button v-if="canEditProfile" class="btn profile-edit-btn" @click="editProfile"><i class="bi bi-pencil-square" aria-hidden="true"></i> Editar perfil</button>
      </header>

      <section class="profile-metrics" aria-label="Resumen profesional">
        <div class="profile-metric"><span class="metric-icon blue"><i class="bi bi-code-slash" aria-hidden="true"></i></span><div><strong>{{ user.habilidades?.length || 0 }}</strong><span>Habilidades técnicas</span></div></div>
        <div class="profile-metric"><span class="metric-icon violet"><i class="bi bi-briefcase" aria-hidden="true"></i></span><div><strong>{{ user.aniosExperiencia ?? '—' }} <small v-if="user.aniosExperiencia != null">años</small></strong><span>Experiencia</span></div></div>
        <div class="profile-metric"><span class="metric-icon green"><i class="bi bi-currency-dollar" aria-hidden="true"></i></span><div><strong>{{ user.costoPorHora != null ? '$' + user.costoPorHora : '—' }} <small>/ hora</small></strong><span>Costo de trabajo</span></div></div>
        <div class="profile-metric"><span class="metric-icon amber"><i class="bi bi-star" aria-hidden="true"></i></span><div><strong>{{ getCalificacionDisplay(user) }}</strong><span>Calificación</span><small class="metric-note">{{ getCalificacionTareasLabel(user) || (getCalificacionDisplay(user) === '—' ? 'Sin calificaciones aún' : 'Calificación general') }}</small></div></div>
      </section>

      <div class="profile-layout">
        <div class="profile-sidebar">
          <section class="profile-panel profile-section" aria-labelledby="profile-info-title">
            <div class="profile-section-heading"><span class="section-icon blue"><i class="bi bi-person-vcard" aria-hidden="true"></i></span><div><h2 id="profile-info-title">Información personal</h2><p>Datos del integrante</p></div></div>
            <dl class="profile-facts">
              <div><dt>DNI</dt><dd>{{ user.dni || 'No especificado' }}</dd></div>
              <div><dt>Email</dt><dd>{{ user.email || 'No especificado' }}</dd></div>
              <div><dt>Rol</dt><dd>{{ user.rol === 'admin' ? 'Administrador' : 'Desarrollador' }}</dd></div>
              <div><dt>Fecha de registro</dt><dd>{{ formatDate(user.fechaCreacion) }}</dd></div>
            </dl>
          </section>
          <section class="profile-panel profile-section" aria-labelledby="profile-skills-title">
            <div class="profile-section-heading"><span class="section-icon violet"><i class="bi bi-code-square" aria-hidden="true"></i></span><div><h2 id="profile-skills-title">Habilidades técnicas</h2><p>Conocimientos y nivel de dominio</p></div><span class="section-count">{{ user.habilidades?.length || 0 }}</span></div>
            <div v-if="user.habilidades?.length" class="profile-skills">
              <div v-for="(skill, index) in user.habilidades" :key="index" class="profile-skill">
                <div class="skill-heading"><h3>{{ skill.nombre }}</h3><span class="skill-level">{{ getNivelText(skill.nivel) }}</span></div>
                <div class="skill-scale" role="progressbar" :aria-label="'Nivel de ' + skill.nombre" :aria-valuenow="Number(skill.nivel)" aria-valuemin="0" aria-valuemax="5"><span :style="{ width: Math.min(100, Math.max(0, Number(skill.nivel) / 5 * 100)) + '%' }"></span></div>
                <p class="skill-caption">Nivel {{ skill.nivel }} de 5</p>
              </div>
            </div>
            <div v-else class="profile-empty"><i class="bi bi-code-square" aria-hidden="true"></i><p>Aún no hay habilidades registradas.</p></div>
          </section>
          <section class="profile-panel profile-section" aria-labelledby="profile-preferences-title">
            <div class="profile-section-heading"><span class="section-icon green"><i class="bi bi-sliders" aria-hidden="true"></i></span><div><h2 id="profile-preferences-title">Preferencias de trabajo</h2><p>Intereses para próximos proyectos</p></div></div>
            <p v-if="preferenceText" class="preference-text">{{ preferenceText }}</p>
            <template v-else-if="user.preferencias?.tipoTarea?.length || user.preferencias?.tecnologias?.length">
              <div v-if="user.preferencias.tipoTarea?.length" class="preference-group"><h3>Tipos de tarea</h3><div class="preference-tags"><span v-for="tipo in user.preferencias.tipoTarea" :key="tipo">{{ tipo }}</span></div></div>
              <div v-if="user.preferencias.tecnologias?.length" class="preference-group"><h3>Tecnologías</h3><div class="preference-tags"><span v-for="tech in user.preferencias.tecnologias" :key="tech">{{ tech }}</span></div></div>
            </template>
            <p v-else class="profile-empty-copy">Aún no hay preferencias registradas.</p>
          </section>
        </div>
        <div class="profile-main">
          <section class="profile-panel profile-section profile-calendar" aria-labelledby="profile-calendar-title">
            <div class="profile-section-heading"><span class="section-icon blue"><i class="bi bi-calendar3" aria-hidden="true"></i></span><div><h2 id="profile-calendar-title">Calendario de disponibilidad</h2><p>Organiza el tiempo y consulta las horas de cada día.</p></div></div>
            <div v-if="calendarLoading" class="profile-state" role="status"><div class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></div><p>Cargando calendario...</p></div>
            <CalendarAvailability v-else
              :user-id="user._id"
              :user-calendar="userCalendar"
              @update-availability="handleUpdateAvailability"
              @remove-availability="handleRemoveAvailability"
              @initialize-default-availability="handleInitializeDefaultAvailability"
              @update-work-days-config="handleUpdateWorkDaysConfig"
              @update-calendar-data="handleUpdateCalendarData"
            />
          </section>
          <section v-if="user.historialDesempeño?.length" class="profile-panel profile-section" aria-labelledby="profile-history-title">
            <div class="profile-section-heading"><span class="section-icon amber"><i class="bi bi-graph-up-arrow" aria-hidden="true"></i></span><div><h2 id="profile-history-title">Historial de desempeño</h2><p>Calificaciones registradas por proyecto</p></div></div>
            <div class="profile-history">
              <div v-for="(historial, index) in user.historialDesempeño.slice(0, 3)" :key="index" class="history-item">
                <div class="skill-heading"><span>Proyecto {{ index + 1 }}</span><span class="badge" :class="getRatingClass(historial.calificacion)">{{ historial.calificacion }}/5</span></div>
                <div class="progress" role="progressbar" :aria-label="'Calificación del proyecto ' + (index + 1)" :aria-valuenow="Number(historial.calificacion)" aria-valuemin="0" aria-valuemax="5"><div class="progress-bar" :class="getRatingClass(historial.calificacion)" :style="{ width: (historial.calificacion / 5) * 100 + '%' }"></div></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>


    <!-- Modal de Edición (reutilizar el existente) -->
    <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Editar Perfil</h5>
            <button type="button" class="btn-close" @click="closeEditModal" aria-label="Cerrar"></button>
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
                  <label for="editHorasSemanalMaxima" class="form-label">Horas Semanales Máximas</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="editHorasSemanalMaxima" 
                    v-model="editForm.horasSemanalMaxima"
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
import CalendarAvailability from '@/components/CalendarAvailability.vue';

export default {
  name: 'PerfilUsuarioView',
  components: {
    CalendarAvailability
  },
  data() {
    return {
      user: null,
      loading: true,
      error: null,
      editModalInstance: null,
      // Propiedades para el calendario
      userCalendar: [],
      calendarLoading: true,
      currentUser: null,
      editForm: {
        dni: '',
        aniosExperiencia: null,
        horasSemanalMaxima: null,
        costoPorHora: null,
        habilidades: [],
        preferencias: []
      },
      editMessage: '',
      editMessageClass: '',
      saving: false
    };
  },
  computed: {
    userInitials() {
      const name = [this.user?.nombre, this.user?.apellido].filter(Boolean).join(' ');
      return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U';
    },
    preferenceText() {
      const preferences = this.user?.preferencias;
      if (typeof preferences === 'string') return preferences.trim();
      if (Array.isArray(preferences)) return preferences.filter(item => typeof item === 'string').join(' / ');
      return '';
    },
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
        
        // Cargar calendario después de cargar el perfil
        await this.loadUserCalendar();
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
    /** Calificación para mostrar en Estadísticas: puntuacionPromedioCalidad o preferenciasHabilidad (general) */
    getCalificacionDisplay(user) {
      const pq = user?.puntuacionPromedioCalidad?.puntuacionPromedio;
      const tareas = user?.puntuacionPromedioCalidad?.tareasCalificadas ?? 0;
      if (tareas > 0 && pq != null) return Number(pq).toFixed(1) + '/5';
      const general = user?.preferenciasHabilidad?.find(p => p.habilidad === 'general');
      const prom = general?.puntuacionPromedio;
      if (prom != null) return Number(prom).toFixed(1) + '/5';
      return '—';
    },
    getCalificacionTareasLabel(user) {
      const tareas = user?.puntuacionPromedioCalidad?.tareasCalificadas ?? 0;
      if (tareas === 0) return '';
      return tareas + ' tarea(s) calificada(s)';
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
        horasSemanalMaxima: this.user.horasSemanalMaxima || null,
        costoPorHora: this.user.costoPorHora || null,
        habilidades: this.user.habilidades ? [...this.user.habilidades] : [{ nombre: '', nivel: '' }],
        preferencias: this.user.preferencias || []
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
          horasSemanalMaxima: this.editForm.horasSemanalMaxima,
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
    },

    // Métodos para manejar el calendario
    async loadUserCalendar() {
      if (!this.user || !this.user._id) {
        console.log('No hay usuario para cargar calendario');
        return;
      }

      this.calendarLoading = true;
      try {
        console.log('🔍 PerfilUsuario - Cargando calendario para usuario:', this.user._id);
        const response = await UserService.getUserCalendar(this.user._id);
        this.userCalendar = response.data.calendario || [];
        console.log('🔍 PerfilUsuario - Calendario cargado:', this.userCalendar);
      } catch (error) {
        console.error('Error cargando calendario:', error);
        this.userCalendar = [];
      } finally {
        this.calendarLoading = false;
      }
    },

    async handleUpdateAvailability(availabilityData) {
      try {
        console.log('🔍 PerfilUsuario - Actualizando disponibilidad:', availabilityData);
        
        // Enviar actualización al backend (el backend espera un array de cambios)
        await UserService.updateUserCalendar(this.user._id, [availabilityData]);
        
        // Actualizar el calendario local después de la actualización exitosa
        const existingIndex = this.userCalendar.findIndex(entry => entry.fecha === availabilityData.fecha);
        
        if (existingIndex >= 0) {
          // Actualizar entrada existente
          this.userCalendar[existingIndex] = availabilityData;
        } else {
          // Agregar nueva entrada
          this.userCalendar.push(availabilityData);
        }
        
        console.log('🔍 PerfilUsuario - Disponibilidad actualizada correctamente');
      } catch (error) {
        console.error('Error updating availability:', error);
        console.error('Error details:', error.response?.data);
        
        // Mostrar mensaje de error más informativo
        const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
        
        // Si el error es por tareas asignadas, mostrar mensaje específico
        if (errorMsg.includes('tareas asignadas')) {
          alert(`⚠️ No se puede modificar la disponibilidad\n\n${errorMsg}\n\nLos días con tareas asignadas no pueden ser modificados.`);
        } else {
          alert(`Error al actualizar disponibilidad: ${errorMsg}`);
        }
        
        // Revertir cambios en caso de error
        await this.loadUserCalendar();
        // NO hacer throw error; para evitar que se muestre como error no manejado
      }
    },

    async handleRemoveAvailability(date) {
      try {
        console.log('🔍 PerfilUsuario - Eliminando disponibilidad para:', date);
        
        // Remover del array local
        this.userCalendar = this.userCalendar.filter(entry => entry.fecha !== date);
        
        // Enviar actualización al backend
        await UserService.updateUserCalendar(this.user._id, this.userCalendar);
        
        console.log('🔍 PerfilUsuario - Disponibilidad eliminada correctamente');
      } catch (error) {
        console.error('Error removing availability:', error);
        console.error('Error details:', error.response?.data);
        
        // Mostrar mensaje de error
        const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
        alert(`Error al eliminar disponibilidad: ${errorMsg}`);
        
        // Revertir cambios en caso de error
        await this.loadUserCalendar();
        // NO hacer throw error; para evitar que se muestre como error no manejado
      }
    },

    async handleInitializeDefaultAvailability(newAvailabilityEntries) {
      try {
        console.log('🔍 PerfilUsuario - Inicializando disponibilidad por defecto:', newAvailabilityEntries);
        
        // Enviar solo las nuevas entradas al backend (no todo el calendario)
        await UserService.updateUserCalendar(this.user._id, newAvailabilityEntries);
        
        // Agregar las nuevas entradas al calendario local solo si el backend las aceptó
        this.userCalendar.push(...newAvailabilityEntries);
        
        console.log('🔍 PerfilUsuario - Disponibilidad por defecto inicializada correctamente');
      } catch (error) {
        console.error('Error initializing default availability:', error);
        
        // Si el error es por tareas asignadas, no mostrar alerta molesta
        if (error.response?.data?.error?.includes('tareas asignadas')) {
          console.log('ℹ️ PerfilUsuario - Algunos días no se pueden modificar porque tienen tareas asignadas (comportamiento esperado)');
        } else {
          alert('Error al inicializar la disponibilidad por defecto: ' + (error.response?.data?.error || error.message));
        }
      }
    },

    async handleUpdateWorkDaysConfig(config) {
      try {
        console.log('🔍 PerfilUsuario - Actualizando configuración de días laborales:', config);
        
        // Aquí podrías guardar la configuración en el backend si es necesario
        // Por ahora solo guardamos en localStorage para persistencia local
        localStorage.setItem('workDaysConfig', JSON.stringify(config));
        
        console.log('🔍 PerfilUsuario - Configuración de días laborales guardada correctamente');
      } catch (error) {
        console.error('Error updating work days config:', error);
        alert('Error al guardar la configuración de días laborales: ' + (error.response?.data?.error || error.message));
      }
    },

    handleUpdateCalendarData(calendarData) {
      console.log('🔍 PerfilUsuario - Actualizando datos del calendario desde múltiples meses:', calendarData);
      this.userCalendar = calendarData;
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100%;
  padding: 1.5rem clamp(1rem, 3vw, 3rem) 2.5rem;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%);
  color: #1a2332;
}
.profile-breadcrumb { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; font-size: 0.8rem; color: #64748b; }
.profile-breadcrumb button { display: inline-flex; align-items: center; gap: 0.5rem; border: 0; padding: 0.25rem 0; background: transparent; color: #52647d; }
.profile-breadcrumb button:hover { color: #0d6efd; }
.profile-panel { background: #fff; border: 1px solid #e3e9f1; border-radius: 0.85rem; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03); }
.profile-hero { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 2rem; margin-bottom: 1.25rem; background: linear-gradient(110deg, #fff 55%, #edf3ff); }
.profile-identity { display: flex; align-items: center; gap: 1.4rem; min-width: 0; }
.profile-avatar { display: grid; place-items: center; flex-shrink: 0; width: 88px; height: 88px; border: 4px solid #fff; border-radius: 1.3rem; background: linear-gradient(145deg, #e0e7ff, #c7d2fe); color: #454b91; font-size: 1.9rem; font-weight: 700; box-shadow: 0 4px 15px #4657aa12; }
.profile-identity-text { min-width: 0; }
.profile-eyebrow { color: #0d6efd; font-size: 0.65rem; letter-spacing: 0.12em; font-weight: 700; }
.profile-hero h1 { font-size: clamp(1.6rem, 3vw, 2.2rem); letter-spacing: -0.035em; font-weight: 750; margin: 0.3rem 0 0.7rem; overflow-wrap: anywhere; }
.profile-identity-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.65rem 1rem; font-size: 0.85rem; color: #64748b; }
.profile-role { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 2rem; padding: 0.3rem 0.7rem; font-size: 0.75rem; font-weight: 600; background: #eaf1ff; color: #285caa; }
.profile-email { overflow-wrap: anywhere; }
.profile-email i { margin-right: 0.3rem; }
.profile-edit-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; flex-shrink: 0; background: linear-gradient(135deg, #0d6efd, #0a58ca); border: 0; border-radius: 0.5rem; color: #fff; padding: 0.65rem 1rem; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 12px #0d6efd20; }
.profile-edit-btn:hover { background: #0a58ca; color: #fff; }
.profile-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.profile-metric { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: #fff; border: 1px solid #e3e9f1; border-radius: 0.75rem; }
.profile-metric > div { min-width: 0; }
.metric-icon { display: grid; place-items: center; flex-shrink: 0; width: 2.65rem; height: 2.65rem; border-radius: 0.65rem; font-size: 1.2rem; }
.blue { background: #e8f1ff; color: #0d6efd; }
.violet { background: #f0ebfa; color: #7952b3; }
.green { background: #e7f5ee; color: #198754; }
.amber { background: #fff4d9; color: #946500; }
.profile-metric strong { display: block; font-size: 1.65rem; letter-spacing: -0.035em; line-height: 1.25; overflow-wrap: anywhere; }
.profile-metric strong small { font-size: 0.8rem; font-weight: 500; color: #64748b; letter-spacing: 0; }
.profile-metric div > span { display: block; color: #64748b; font-size: 0.8rem; margin-top: 0.35rem; }
.metric-note { display: block; color: #64748b; font-size: 0.7rem; margin-top: 0.25rem; }
.profile-layout { display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.65fr); align-items: start; gap: 1.5rem; }
.profile-sidebar, .profile-main { display: grid; gap: 1.25rem; min-width: 0; }
.profile-section { padding: 1.5rem; min-width: 0; }
.profile-section-heading { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.4rem; }
.section-icon { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; flex-shrink: 0; border-radius: 0.6rem; }
.profile-section-heading h2 { font-size: 1rem; font-weight: 650; line-height: 1.4; margin: 0; }
.profile-section-heading p { font-size: 0.75rem; color: #64748b; margin: 0.25rem 0 0; }
.section-count { margin-left: auto; background: #f0ebfa; color: #7952b3; border-radius: 0.4rem; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; }
.profile-facts { margin: 0; }
.profile-facts > div { display: grid; grid-template-columns: 95px minmax(0, 1fr); gap: 0.75rem; padding: 0.85rem 0; border-bottom: 1px solid #eef2f7; font-size: 0.8rem; }
.profile-facts > div:first-child { padding-top: 0; }
.profile-facts > div:last-child { padding-bottom: 0; border: 0; }
.profile-facts dt { color: #64748b; font-weight: 500; }
.profile-facts dd { margin: 0; overflow-wrap: anywhere; }
.profile-skills { display: grid; gap: 1rem; }
.profile-skill { padding: 1rem; border: 1px solid #e9edf5; border-radius: 0.6rem; background: #fcfcff; }
.skill-heading { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.85rem; flex-wrap: wrap; }
.skill-heading h3 { margin: 0; font-size: 0.9rem; font-weight: 650; overflow-wrap: anywhere; }
.skill-level { background: #eeebfa; color: #68519d; border-radius: 0.35rem; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 600; }
.skill-scale { height: 6px; background: #e9eaf4; border-radius: 6px; overflow: hidden; }
.skill-scale > span { display: block; height: 100%; background: linear-gradient(90deg, #7775cc, #a09fe6); border-radius: inherit; }
.skill-caption { margin: 0.5rem 0 0; font-size: 0.7rem; color: #64748b; }
.preference-group + .preference-group { margin-top: 1rem; }
.preference-group h3 { font-size: 0.75rem; font-weight: 500; color: #64748b; margin-bottom: 0.6rem; }
.preference-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.preference-tags span { padding: 0.35rem 0.65rem; background: #f1f5f9; color: #52647d; border-radius: 0.4rem; font-size: 0.75rem; overflow-wrap: anywhere; }
.preference-text { white-space: pre-line; overflow-wrap: anywhere; color: #52647d; font-size: 0.85rem; line-height: 1.7; margin: 0; }
.profile-empty { padding: 1.5rem 0.75rem; text-align: center; background: #f8fafc; border: 1px dashed #dce3ed; border-radius: 0.6rem; color: #64748b; }
.profile-empty > i { font-size: 1.5rem; }
.profile-empty p { margin: 0.6rem 0 0; font-size: 0.8rem; }
.profile-empty-copy { margin: 0; color: #64748b; font-size: 0.8rem; }
.profile-state { padding: 3rem 1rem; text-align: center; color: #64748b; }
.profile-state p { margin: 0.75rem 0 0; font-size: 0.85rem; }
.profile-history { display: grid; gap: 1rem; }
.history-item { font-size: 0.85rem; }
.history-item .progress { height: 6px; background: #edf2f7; }
.profile-page .modal-content { border: 1px solid #e3e9f1; border-radius: 0.85rem; }
.profile-page .modal-header { background: #f8fafc; border-bottom: 1px solid #e3e9f1; }
.profile-page .modal-title { font-size: 1.1rem; font-weight: 650; }
.profile-page .modal-footer .btn { width: auto; margin: 0; font-size: 0.9rem; border-radius: 0.5rem; }
.profile-page button:focus-visible { outline: 3px solid #84b8ff; outline-offset: 3px; }

/* El calendario compartido adopta el tema solamente dentro de este perfil. */
.profile-calendar :deep(.calendar-availability) { padding: 0; box-shadow: none; background: transparent; }
.profile-calendar :deep(.calendar-availability > .d-flex) { flex-wrap: wrap; gap: 0.85rem; padding-top: 1rem; border-top: 1px solid #edf2f7; }
.profile-calendar :deep(.calendar-availability > .d-flex > h6) { color: #64748b; font-size: 0.8rem; }
.profile-calendar :deep(.calendar-availability > .d-flex > .d-flex) { flex-wrap: wrap; align-items: center; }
.profile-calendar :deep(.calendar-availability > .d-flex .fw-bold) { font-size: 0.85rem; min-width: 130px; text-align: center; }
.profile-calendar :deep(.calendar-availability > .d-flex .btn) { border-radius: 0.45rem; font-size: 0.75rem; padding: 0.4rem 0.6rem; }
.profile-calendar :deep(.calendar-availability > .row .alert-info) { background: #f0f6ff; border: 1px solid #e0ebfc; border-radius: 0.6rem; font-size: 0.8rem; line-height: 1.65; color: #526b91; margin-bottom: 0; padding: 0.85rem 1rem; }
.profile-calendar :deep(.calendar-grid) { border-color: #e3e9f1; border-radius: 0.65rem; }
.profile-calendar :deep(.calendar-header) { background: #f8fafc; border-color: #e3e9f1; }
.profile-calendar :deep(.calendar-day-header) { border-color: #e3e9f1; font-size: 0.7rem; padding: 0.7rem 0.1rem; color: #64748b; }
.profile-calendar :deep(.calendar-day) { border-color: #e3e9f1; min-height: 88px; padding: 0.6rem; }
.profile-calendar :deep(.calendar-day.other-month) { background: #f8fafc; color: #94a3b8; }
.profile-calendar :deep(.calendar-day.has-assigned-tasks) { background: #fffbef; border-left: 1px solid #f1e2b2; }
.profile-calendar :deep(.calendar-day.today) { background: #edf4ff; border: 2px solid #6ea8fe; }
.profile-calendar :deep(.calendar-day:not(.other-month):hover) { background: #eaf2ff; }
.profile-calendar :deep(.day-number) { font-size: 0.85rem; color: inherit; }
.profile-calendar :deep(.hours-text) { background: #e4f3eb; color: #187747; border-radius: 0.35rem; font-size: 0.7rem; }
.profile-calendar :deep(.no-hours) { color: #9b4a42; font-size: 0.7rem; }
@media (max-width: 1100px) {
  .profile-layout { grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.2fr); gap: 1rem; }
  .profile-section { padding: 1.2rem; }
  .profile-metric { gap: 0.65rem; padding: 1rem; }
  .profile-metric strong { font-size: 1.4rem; }
}
@media (max-width: 900px) {
  .profile-layout { grid-template-columns: minmax(0, 1fr); }
  .profile-sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
  .profile-calendar :deep(.calendar-day) { min-height: 76px; }
}
@media (max-width: 640px) {
  .profile-hero { flex-direction: column; align-items: stretch; padding: 1.25rem; }
  .profile-identity { gap: 0.85rem; align-items: flex-start; }
  .profile-avatar { width: 62px; height: 62px; border-radius: 1rem; font-size: 1.3rem; }
  .profile-hero h1 { font-size: 1.5rem; }
  .profile-email { font-size: 0.75rem; }
  .profile-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
  .profile-metric { flex-direction: column; }
  .profile-sidebar { grid-template-columns: minmax(0, 1fr); }
  .profile-calendar { padding: 1rem; }
  .profile-calendar :deep(.calendar-day) { min-height: 65px; padding: 0.3rem 0.15rem; }
  .profile-calendar :deep(.calendar-availability > .d-flex > .d-flex) { width: 100%; gap: 0.4rem !important; }
  .profile-calendar :deep(.calendar-availability > .d-flex .btn:first-child) { flex-basis: 100%; }
  .profile-calendar :deep(.calendar-availability > .d-flex .fw-bold) { flex: 1; min-width: 0; }
}
</style>
