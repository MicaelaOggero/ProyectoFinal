<template>
  <div class="personas-page">
    <div class="container-fluid px-3 px-lg-4 py-4">
      <header class="personas-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 class="personas-title mb-1">Gestión de Personas</h1>
          <p class="personas-subtitle text-muted mb-0">
            {{ isUserAdmin ? 'Consulta y administra el equipo y sus habilidades' : 'Directorio del equipo' }}
          </p>
        </div>
        <button
          v-if="isUserAdmin"
          type="button"
          class="btn btn-add-person"
          @click="openCreateModal"
        >
          <i class="bi bi-person-plus me-1"></i>
          Añadir Nueva Persona
        </button>
      </header>

      <!-- Carga -->
      <div v-if="loading" class="text-center py-5 personas-panel">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted mb-0">Cargando personas...</p>
      </div>

      <!-- Sin datos -->
      <div v-else-if="people.length === 0" class="personas-panel empty-state text-center py-5">
        <i class="bi bi-people display-4 text-muted d-block mb-3"></i>
        <h5 class="fw-semibold">No hay personas registradas</h5>
        <p class="text-muted mb-0">Añade la primera persona desde el botón superior.</p>
      </div>

      <template v-else>
        <!-- Métricas -->
        <div class="row g-3 g-lg-4 mb-4">
          <div v-for="card in statsCards" :key="card.key" class="col-6 col-lg-3">
            <div class="stat-card h-100">
              <div class="stat-icon-wrap" :class="card.iconWrapClass">
                <i :class="card.icon"></i>
              </div>
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </div>

        <!-- Búsqueda -->
        <div class="filters-bar personas-panel mb-4">
          <label class="visually-hidden" for="buscarPersonas">Buscar</label>
          <div class="input-group input-group-search">
            <span class="input-group-text border-end-0 bg-white"><i class="bi bi-search text-muted"></i></span>
            <input
              id="buscarPersonas"
              v-model="searchQuery"
              type="search"
              class="form-control border-start-0"
              placeholder="Buscar por nombre o apellido..."
              autocomplete="off"
            >
          </div>
        </div>

        <div v-if="filteredPeople.length === 0" class="personas-panel empty-state text-center py-5">
          <i class="bi bi-funnel display-6 text-muted d-block mb-2"></i>
          <p class="text-muted mb-0">No hay coincidencias con la búsqueda.</p>
        </div>

        <!-- Tarjetas -->
        <div v-else class="person-cards">
          <article
            v-for="person in filteredPeople"
            :key="person._id"
            class="person-card personas-panel"
          >
            <div class="person-card-avatar" :aria-label="fullName(person)">
              {{ getInitials(person) }}
            </div>
            <div class="person-card-body">
              <div class="person-card-top">
                <div class="person-card-identity">
                  <button
                    type="button"
                    class="link-name btn btn-link p-0 text-start"
                    @click="viewProfile(person)"
                  >
                    {{ fullName(person) }}
                  </button>
                  <div class="person-meta text-muted small mt-1">
                    <span v-if="person.dni" class="me-3">
                      <i class="bi bi-card-text me-1"></i>DNI {{ person.dni }}
                    </span>
                    <span v-else class="me-3 text-muted">
                      <i class="bi bi-dash-circle me-1"></i>Sin DNI
                    </span>
                    <span v-if="person.rol" class="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle">
                      {{ person.rol }}
                    </span>
                  </div>
                </div>
                <div class="person-exp text-end">
                  <div class="exp-label text-muted small">Experiencia</div>
                  <div class="exp-value">
                    {{ person.aniosExperiencia != null && person.aniosExperiencia !== '' ? person.aniosExperiencia + ' años' : '—' }}
                  </div>
                </div>
              </div>
              <div class="person-skills mt-3">
                <div class="skills-label text-muted small mb-2">Habilidades</div>
                <div v-if="!person.habilidades || person.habilidades.length === 0" class="text-muted small fst-italic">
                  Sin habilidades registradas
                </div>
                <div v-else class="d-flex flex-wrap gap-2">
                  <span
                    v-for="(s, idx) in (person.habilidades || []).slice(0, 8)"
                    :key="idx"
                    class="badge skill-chip rounded-pill"
                  >
                    {{ skillLabel(s) }}
                  </span>
                  <span
                    v-if="person.habilidades.length > 8"
                    class="badge bg-light text-secondary border rounded-pill"
                  >
                    +{{ person.habilidades.length - 8 }} más
                  </span>
                </div>
              </div>
            </div>
            <div class="person-card-actions d-flex flex-shrink-0 align-items-start gap-2">
              <button 
                type="button" 
                class="btn btn-outline-primary btn-sm btn-view"
                @click="viewProfile(person)"
              >
                <i class="bi bi-person-lines-fill me-1"></i>
                Ver perfil
              </button>
              <div v-if="isUserAdmin" class="dropdown">
                <button
                  class="btn btn-light border btn-icon"
                  type="button"
                  :id="'pmenu-' + person._id"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Más acciones"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" :aria-labelledby="'pmenu-' + person._id">
                  <li>
                    <button type="button" class="dropdown-item" @click="openEditModal(person)">
                      <i class="bi bi-pencil me-2 text-secondary"></i>Editar
                    </button>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <button type="button" class="dropdown-item text-danger" @click="deletePerson(person._id)">
                      <i class="bi bi-trash me-2"></i>Eliminar
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>

    <!-- Modal para Crear/Editar Persona -->
    <div class="modal fade" id="personModal" tabindex="-1" aria-labelledby="personModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="personModalLabel">{{ isEditMode ? 'Editar Persona' : 'Añadir Nueva Persona' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
                         <div class="alert alert-info mb-3">
               <i class="bi bi-info-circle me-2"></i>
               <strong>Información:</strong> Los campos marcados con * son obligatorios.
               <span v-if="editablePerson.googleId" class="ms-2">
                 <i class="bi bi-google text-danger"></i>
                 <strong>Usuario de Google:</strong> DNI y habilidades son opcionales.
               </span>
             </div>
            <form @submit.prevent="savePerson">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="personName" class="form-label">Nombre Completo *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :class="{ 'is-invalid': hasFieldError('name') }"
                    id="personName" 
                    v-model="editablePerson.name" 
                    required
                    placeholder="Ej: Juan Pérez"
                    @input="validateNameInput"
                  >
                  <div class="invalid-feedback" v-if="hasFieldError('name')">
                    {{ getFieldError('name') }}
                  </div>
                </div>
                                 <div class="col-md-6 mb-3">
                   <label for="personDni" class="form-label">
                     DNI 
                     <span v-if="!editablePerson.googleId" class="text-danger">*</span>
                     <span v-else class="text-muted">(opcional)</span>
                   </label>
                                     <input 
                     type="text" 
                     class="form-control" 
                     :class="{ 'is-invalid': hasFieldError('dni') }"
                     id="personDni" 
                     v-model="editablePerson.dni" 
                     :required="!editablePerson.googleId"
                     placeholder="Ej: 43844509"
                     maxlength="8"
                     @input="validateDniInput"
                   >
                  <div class="invalid-feedback" v-if="hasFieldError('dni')">
                    {{ getFieldError('dni') }}
                  </div>
                </div>
              </div>
              
              <!-- Campos de email y contraseña solo para creación -->
              <div v-if="!isEditMode" class="row">
                <div class="col-md-6 mb-3">
                  <label for="personEmail" class="form-label">Email *</label>
                  <div class="input-group">
                    <input 
                      type="email" 
                      class="form-control" 
                      :class="{ 'is-invalid': hasFieldError('email') }"
                      id="personEmail" 
                      v-model="editablePerson.email" 
                      required
                      placeholder="Ej: juan@ejemplo.com"
                      @input="validateEmailInput"
                    >
                    <button type="button" class="btn btn-outline-secondary" @click="generateEmail" title="Generar email automático">
                      <i class="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" v-if="hasFieldError('email')">
                    {{ getFieldError('email') }}
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="personPassword" class="form-label">Contraseña *</label>
                  <div class="input-group">
                    <input 
                      type="password" 
                      class="form-control" 
                      :class="{ 'is-invalid': hasFieldError('password') }"
                      id="personPassword" 
                      v-model="editablePerson.password" 
                      required
                      placeholder="Mínimo 6 caracteres"
                      minlength="6"
                      @input="validatePasswordInput"
                    >
                    <button type="button" class="btn btn-outline-secondary" @click="generatePassword" title="Generar contraseña automática">
                      <i class="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" v-if="hasFieldError('password')">
                    {{ getFieldError('password') }}
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="personYearsExperience" class="form-label">Años de Experiencia</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="personYearsExperience" 
                    v-model.number="editablePerson.yearsExperience" 
                    min="0"
                    max="50"
                    placeholder="Ej: 3"
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="personCostPerHour" class="form-label">Costo por Hora ($)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="personCostPerHour" 
                    v-model.number="editablePerson.costPerHour" 
                    min="0"
                    step="0.01"
                    placeholder="Ej: 25.50"
                  >
                </div>
              </div>
              
              <hr>
                             <h5>
                 Habilidades Técnicas 
                 <span v-if="!editablePerson.googleId" class="text-danger">*</span>
                 <span v-else class="text-muted">(opcional)</span>
               </h5>
              <div v-if="hasFieldError('skills')" class="alert alert-danger">
                {{ getFieldError('skills') }}
              </div>
              
              <!-- Debug: Mostrar habilidades cargadas -->
              
              <div v-for="(skill, index) in editablePerson.skills" :key="index" class="row align-items-center mb-2">
                <div class="col-md-6">
                  <select 
                    class="form-select" 
                    :class="{ 'is-invalid': hasFieldError(`skill_${index}_name`) }"
                    v-model="skill.name"
                  >
                    <option value="">Seleccione una habilidad</option>
                    <option v-for="opt in skillOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <div class="invalid-feedback" v-if="hasFieldError(`skill_${index}_name`)">
                    {{ getFieldError(`skill_${index}_name`) }}
                  </div>
                </div>
                <div class="col-md-4">
                  <select 
                    class="form-select" 
                    :class="{ 'is-invalid': hasFieldError(`skill_${index}_level`) }"
                    v-model="skill.level"
                  >
                    <option disabled value="">Nivel</option>
                    <option value="1">1 - Principiante</option>
                    <option value="2">2 - Básico</option>
                    <option value="3">3 - Intermedio</option>
                    <option value="4">4 - Avanzado</option>
                    <option value="5">5 - Experto</option>
                  </select>
                  <div class="invalid-feedback" v-if="hasFieldError(`skill_${index}_level`)">
                    {{ getFieldError(`skill_${index}_level`) }}
                  </div>
                </div>
                <div class="col-md-2">
                  <button type="button" class="btn btn-sm btn-danger" @click="removeSkill(index)">Quitar</button>
                </div>
              </div>
              <button type="button" class="btn btn-sm btn-success mt-2" @click="addSkill">Añadir Habilidad</button>

              <div class="modal-footer mt-4">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import UserService from '@/services/user.service.js';
import SkillsService from '@/services/skills.service.js';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'PersonasView',
  data() {
    return {
      modalInstance: null,
      isEditMode: false,
      people: [],
      currentUser: null,
      loading: false,
      searchQuery: '',
      editablePerson: { skills: [] },
      skillOptions: [],
      validationErrors: {},
      isSubmitting: false
    };
  },
  computed: {
    isUserAdmin() {
      return AuthService.isAdmin(this.currentUser);
    },
    filteredPeople() {
      const q = (this.searchQuery || '').trim().toLowerCase();
      const list = [...(this.people || [])];
      if (!q) return list;
      return list.filter(p => {
        const full = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
        return full.includes(q);
      });
    },
    statsCards() {
      const p = this.people || [];
      const total = p.length;
      let sumExp = 0;
      let countExp = 0;
      let withSkills = 0;
      p.forEach(x => {
        if (x.aniosExperiencia != null && x.aniosExperiencia !== '') {
          sumExp += Number(x.aniosExperiencia) || 0;
          countExp++;
        }
        if (x.habilidades && x.habilidades.length > 0) withSkills++;
      });
      const avgExp = countExp > 0 ? Math.round((sumExp / countExp) * 10) / 10 : null;
      const withDni = p.filter(x => x.dni && String(x.dni).trim() !== '').length;
      return [
        {
          key: 'total',
          value: total,
          label: 'Total personas',
          icon: 'bi bi-people',
          iconWrapClass: 'stat-icon-total'
        },
        {
          key: 'exp',
          value: avgExp != null ? avgExp : '—',
          label: 'Exp. promedio (años)',
          icon: 'bi bi-graph-up-arrow',
          iconWrapClass: 'stat-icon-exp'
        },
        {
          key: 'skills',
          value: withSkills,
          label: 'Con habilidades',
          icon: 'bi bi-stars',
          iconWrapClass: 'stat-icon-skill'
        },
        {
          key: 'dni',
          value: withDni,
          label: 'Con DNI',
          icon: 'bi bi-card-text',
          iconWrapClass: 'stat-icon-dni'
        }
      ];
    }
  },
  async mounted() {
    this.currentUser = await AuthService.checkSession();
    this.modalInstance = new Modal(document.getElementById('personModal'));
    await this.loadUsers();
    this.loadSkills();
  },
  methods: {
    // Métodos de validación
    validateForm() {
      this.validationErrors = {};
      let isValid = true;

      // Validar nombre (solo letras y espacios)
      if (!this.editablePerson.name || this.editablePerson.name.trim() === '') {
        this.validationErrors.name = 'El nombre es requerido';
        isValid = false;
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.editablePerson.name.trim())) {
        this.validationErrors.name = 'El nombre solo debe contener letras y espacios';
        isValid = false;
      } else if (this.editablePerson.name.trim().length < 2) {
        this.validationErrors.name = 'El nombre debe tener al menos 2 caracteres';
        isValid = false;
      }

      // Validar email (solo para creación)
      if (!this.isEditMode) {
        if (!this.editablePerson.email || this.editablePerson.email.trim() === '') {
          this.validationErrors.email = 'El email es requerido';
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editablePerson.email.trim())) {
          this.validationErrors.email = 'El formato del email no es válido';
          isValid = false;
        }

        // Validar contraseña (solo para creación)
        if (!this.editablePerson.password || this.editablePerson.password.trim() === '') {
          this.validationErrors.password = 'La contraseña es requerida';
          isValid = false;
        } else if (this.editablePerson.password.length < 6) {
          this.validationErrors.password = 'La contraseña debe tener al menos 6 caracteres';
          isValid = false;
        }
      }

          // Validar DNI (solo números, 7 u 8 dígitos) - OPCIONAL para usuarios de Google
    console.log('🔍 Validando DNI:', this.editablePerson.dni);
    if (this.editablePerson.dni && this.editablePerson.dni.toString().trim() !== '') {
      console.log('🔍 DNI tiene valor, validando formato...');
      if (!/^\d{7,8}$/.test(this.editablePerson.dni.toString().trim())) {
        console.log('🔍 ❌ DNI formato inválido');
        this.validationErrors.dni = 'El DNI debe contener solo números (7 u 8 dígitos)';
        isValid = false;
      } else {
        console.log('🔍 ✅ DNI formato válido');
      }
    } else {
      console.log('🔍 DNI está vacío o undefined (válido para usuarios de Google)');
    }

      // Validar costo por hora
      if (!this.editablePerson.costPerHour || this.editablePerson.costPerHour <= 0) {
        this.validationErrors.costPerHour = 'El costo por hora es requerido y debe ser mayor a 0';
        isValid = false;
      }

          // Validar habilidades - OPCIONAL para usuarios de Google
    if (this.editablePerson.skills && this.editablePerson.skills.length > 0) {
      for (let i = 0; i < this.editablePerson.skills.length; i++) {
        const skill = this.editablePerson.skills[i];
        if (!skill.name || skill.name.trim() === '') {
          this.validationErrors[`skill_${i}_name`] = 'Debe seleccionar una habilidad';
          isValid = false;
        }
        if (!skill.level || skill.level.toString().trim() === '') {
          this.validationErrors[`skill_${i}_level`] = 'Debe seleccionar un nivel para la habilidad';
          isValid = false;
        }
      }
    }

      return isValid;
    },

    // Validación en tiempo real para DNI
    validateDniInput(event) {
      const input = event.target;
      const value = input.value;
      
      // Solo permitir números
      const numericValue = value.replace(/\D/g, '');
      
      // Limitar a 8 dígitos
      if (numericValue.length > 8) {
        input.value = numericValue.slice(0, 8);
      } else {
        input.value = numericValue;
      }
      
      // Actualizar el modelo - IMPORTANTE: usar el valor del input, no sobrescribir
      this.editablePerson.dni = input.value;
      
      // Limpiar error si ya es válido
      if (this.validationErrors.dni && /^\d{7,8}$/.test(input.value)) {
        delete this.validationErrors.dni;
      }
      
      console.log('🔍 DNI actualizado:', this.editablePerson.dni);
    },

    // Validación en tiempo real para nombre
    validateNameInput(event) {
      const input = event.target;
      const value = input.value;
      
      // Solo permitir letras, espacios y caracteres especiales del español
      const validValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      
      input.value = validValue;
      this.editablePerson.name = validValue;
      
      // Limpiar error si ya es válido
      if (this.validationErrors.name && validValue.trim().length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(validValue.trim())) {
        delete this.validationErrors.name;
      }
    },

    // Validación en tiempo real para email
    validateEmailInput(event) {
      const input = event.target;
      const value = input.value;
      
      this.editablePerson.email = value;
      
      // Limpiar error si ya es válido
      if (this.validationErrors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        delete this.validationErrors.email;
      }
    },

    // Validación en tiempo real para contraseña
    validatePasswordInput(event) {
      const input = event.target;
      const value = input.value;
      
      this.editablePerson.password = value;
      
      // Limpiar error si ya es válido
      if (this.validationErrors.password && value.length >= 6) {
        delete this.validationErrors.password;
      }
    },

    // Generar email automático
    generateEmail() {
      if (this.editablePerson.name) {
        const emailBase = this.editablePerson.name.toLowerCase().replace(/\s+/g, '');
        const timestamp = Date.now();
        this.editablePerson.email = `${emailBase}${timestamp}@temp.com`;
        // Limpiar error si existe
        if (this.validationErrors.email) {
          delete this.validationErrors.email;
        }
      } else {
        alert('Primero ingresa el nombre de la persona');
      }
    },

    // Generar contraseña automática
    generatePassword() {
      const timestamp = Date.now();
      this.editablePerson.password = `temp${timestamp}`;
      // Limpiar error si existe
      if (this.validationErrors.password) {
        delete this.validationErrors.password;
      }
    },

    clearValidationErrors() {
      this.validationErrors = {};
    },

    getFieldError(fieldName) {
      return this.validationErrors[fieldName] || '';
    },

    hasFieldError(fieldName) {
      return !!this.validationErrors[fieldName];
    },

    fullName(person) {
      const n = `${person.nombre || ''} ${person.apellido || ''}`.trim();
      return n || 'Sin nombre';
    },
    getInitials(person) {
      const n = (person.nombre || '').trim();
      const a = (person.apellido || '').trim();
      const i1 = n.charAt(0).toUpperCase();
      const i2 = a.charAt(0).toUpperCase();
      return (i1 + i2) || '?';
    },
    skillLabel(s) {
      if (!s) return '';
      const name = s.nombre || s.name || '';
      const lvl = s.nivel != null ? s.nivel : s.level;
      return lvl != null && lvl !== '' ? `${name} · ${lvl}/5` : name;
    },
    async loadUsers() {
      this.loading = true;
      try {
        const response = await UserService.getUsers();
        this.people = response.data;
      } catch (error) {
        console.error('Error loading users:', error);
        const errorMessage = error.response?.data?.error || 'Error al cargar usuarios';
        this.$toast?.error(errorMessage) || alert(errorMessage);
      } finally {
        this.loading = false;
      }
    },
    loadSkills() {
      SkillsService.getSkills().then(response => {
        // response.data ya es el array de habilidades directamente
        this.skillOptions = response.data.map(skill => skill.nombre);
      }).catch(error => {
        console.error('Error loading skills:', error);
        // Fallback a opciones predefinidas si falla la carga
        this.skillOptions = ['JavaScript', 'Vue.js', 'Node.js', 'SQL', 'HTML & CSS', 'Python', 'Diseño UI'];
      });
    },
    // --- Métodos para el Modal ---
    openCreateModal() {
      if (!this.isUserAdmin) return;
      this.isEditMode = false;
      this.editablePerson = {
        name: '', dni: '', email: '', password: '', role: 'Desarrollador', availability: 40, costPerHour: 20,
        skills: [{ name: '', level: '1' }]
      };
      this.clearValidationErrors();
      this.modalInstance.show();
    },
    openEditModal(person) {
      if (!this.isUserAdmin) return;
      this.isEditMode = true;
      console.log('Editando persona:', person);
      
      // Mapear los campos correctamente desde el backend al frontend
      this.editablePerson = {
        _id: person._id,
        name: person.nombre || '',
        dni: person.dni || '',
        role: person.rol || 'Desarrollador',
        availability: person.horasSemanalMaxima || 40,
        costPerHour: person.costoPorHora || 0,
        yearsExperience: person.aniosExperiencia || 0,
        skills: (person.habilidades && person.habilidades.length > 0) 
          ? person.habilidades.map(skill => ({
              name: skill.nombre || '', // Guardar exactamente como está en la BD
              level: skill.nivel ? skill.nivel.toString() : '1'
            }))
          : [{ name: '', level: '1' }], // Si no hay habilidades, mostrar una vacía para editar
        googleId: person.googleId || null
      };
      
      console.log('🔍 USUARIO COMPLETO del backend:', person);
      console.log('🔍 ¿Es usuario de Google?', !!person.googleId);
      console.log('🔍 DNI cargado del backend:', person.dni);
      console.log('🔍 DNI mapeado al frontend:', this.editablePerson.dni);
      console.log('🔍 Habilidades del backend:', person.habilidades);
      console.log('🔍 Habilidades mapeadas al frontend:', this.editablePerson.skills);
      console.log('🔍 Opciones de habilidades disponibles:', this.skillOptions);
      console.log('Datos mapeados para edición:', this.editablePerson);
      
      // Forzar reactividad de Vue
      this.$nextTick(() => {
        console.log('🔍 Después de $nextTick - editablePerson.skills:', this.editablePerson.skills);
        console.log('🔍 Longitud del array skills:', this.editablePerson.skills.length);
        this.clearValidationErrors();
        this.modalInstance.show();
      });
    },
    closeModal() {
      this.modalInstance.hide();
    },
    async savePerson() {
      // Limpiar errores previos
      this.clearValidationErrors();
      
      console.log('🔍 === INICIO DE savePerson ===');
      console.log('🔍 editablePerson.dni:', this.editablePerson.dni);
      console.log('🔍 editablePerson.dni tipo:', typeof this.editablePerson.dni);
      console.log('🔍 editablePerson.dni length:', this.editablePerson.dni?.toString().length);
      
      // Validar formulario
      if (!this.validateForm()) {
        console.log('🔍 ❌ Validación falló, no continuando');
        return; // No continuar si hay errores de validación
      }
      
      console.log('🔍 ✅ Validación pasó, continuando...');

      // Prevenir múltiples envíos
      if (this.isSubmitting) {
        return;
      }

      this.isSubmitting = true;

      if (this.isEditMode) {
        // Mapear los campos del frontend al backend (solo campos con valor)
        const userData = {};
        
        // Solo agregar DNI si tiene valor
        if (this.editablePerson.dni && this.editablePerson.dni.toString().trim() !== '') {
          userData.dni = this.editablePerson.dni;
          console.log('🔍 ✅ DNI agregado al userData:', this.editablePerson.dni);
        } else {
          console.log('🔍 ❌ DNI NO agregado - está vacío o undefined');
        }
        
        // Solo agregar habilidades si tiene al menos una
        if (this.editablePerson.skills && this.editablePerson.skills.length > 0) {
          userData.habilidades = this.editablePerson.skills.map(skill => ({
            nombre: skill.name,
            nivel: skill.level
          }));
        }
        
        // Campos numéricos con valores por defecto
        userData.aniosExperiencia = parseInt(this.editablePerson.yearsExperience) || 0;
        userData.horasSemanalMaxima = parseInt(this.editablePerson.availability) || 40;
        userData.costoPorHora = parseFloat(this.editablePerson.costPerHour) || 0;
        
        console.log('🔍 DNI antes de enviar:', this.editablePerson.dni);
        console.log('🔍 ¿Es usuario de Google?', !!this.editablePerson.googleId);
        console.log('🔍 userData completo:', userData);
        console.log('🔍 Campos que se envían:', Object.keys(userData));
        console.log('🔍 userData.dni específicamente:', userData.dni);
        console.log('🔍 userData.dni tipo:', typeof userData.dni);
        console.log('Datos a enviar al backend:', userData);
        
        // Lógica de Actualización - Usar la misma lógica para ambos tipos de usuario
        console.log('🔍 Actualizando usuario con UserService.updateUser (debería funcionar para ambos tipos)');
        UserService.updateUser(this.editablePerson._id, userData).then((response) => {
          console.log('✅ Usuario actualizado exitosamente:', response.data);
          this.loadUsers();
          this.closeModal();
          this.isSubmitting = false;
          this.$toast?.success('Usuario actualizado correctamente') || alert('Usuario actualizado correctamente');
        }).catch(error => {
          console.error('❌ Error actualizando usuario:', error);
          this.isSubmitting = false;
          const errorMessage = error.response?.data?.error || 'Error al actualizar el usuario';
          this.$toast?.error(errorMessage) || alert(errorMessage);
        });
      } else {
        // Lógica de Creación
        console.log('🔍 === CREANDO NUEVA PERSONA ===');
        console.log('🔍 editablePerson completo:', this.editablePerson);
        
        // Preparar datos para el registro usando el endpoint de sesión
        const userData = {
          nombre: this.editablePerson.name,
          email: this.editablePerson.email,
          password: this.editablePerson.password,
          dni: this.editablePerson.dni || null,
          aniosExperiencia: parseInt(this.editablePerson.yearsExperience) || 0,
          horasSemanalMaxima: parseInt(this.editablePerson.availability) || 40,
          costoPorHora: parseFloat(this.editablePerson.costPerHour) || 0,
          habilidades: this.editablePerson.skills && this.editablePerson.skills.length > 0 
            ? this.editablePerson.skills.map(skill => ({
                nombre: skill.name,
                nivel: parseInt(skill.level)
              }))
            : []
        };
        
        console.log('🔍 Datos a enviar para registro:', userData);
        
        // Usar el endpoint de registro existente
        fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8080/api'}/session/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }
          console.log('✅ Persona creada exitosamente:', data);
          this.loadUsers();
          this.closeModal();
          this.isSubmitting = false;
          this.$toast?.success('Persona creada correctamente') || alert('Persona creada correctamente');
        })
        .catch(error => {
          console.error('❌ Error creando persona:', error);
          this.isSubmitting = false;
          const errorMessage = error.message || 'Error al crear la persona';
          this.$toast?.error(errorMessage) || alert(errorMessage);
        });
      }
    },
    deletePerson(personId) {
      if (!this.isUserAdmin) return;
      if (window.confirm('¿Estás seguro de que quieres eliminar a esta persona?')) {
        UserService.deleteUser(personId).then(() => {
          this.loadUsers();
        }).catch(error => {
          console.error('Error deleting user:', error);
        });
      }
    },
    // --- Métodos para Habilidades ---
    addSkill() {
      this.editablePerson.skills.push({ name: '', level: '1' });
    },
    removeSkill(index) {
      this.editablePerson.skills.splice(index, 1);
    },
    viewProfile(person) {
      this.$router.push({ name: 'PerfilUsuario', params: { id: person._id } });
    }
  }
}
</script>

<style scoped>
.personas-page {
  min-height: 100%;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%);
}

.personas-title {
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1a2332;
}

.personas-subtitle {
  font-size: 0.95rem;
}

.btn-add-person {
  font-weight: 600;
  padding: 0.55rem 1.15rem;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(13, 110, 253, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-add-person:hover {
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(13, 110, 253, 0.45);
}

.personas-panel {
  background: #fff;
  border-radius: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.empty-state {
  border: 1px dashed rgba(15, 23, 42, 0.12);
}

.stat-card {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.stat-icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  margin-bottom: 0.65rem;
}

.stat-icon-total {
  background: rgba(13, 110, 253, 0.12);
  color: #0d6efd;
}

.stat-icon-exp {
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
}

.stat-icon-skill {
  background: rgba(111, 66, 193, 0.12);
  color: #6f42c1;
}

.stat-icon-dni {
  background: rgba(13, 202, 240, 0.15);
  color: #0aa2c0;
}

.stat-value {
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.1;
  color: #1a2332;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.15rem;
}

.filters-bar {
  padding: 1rem 1.15rem;
}

.input-group-search:focus-within {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  border-radius: 0.5rem;
}

.input-group-search:focus-within .form-control,
.input-group-search:focus-within .input-group-text {
  border-color: #86b7fe;
}

.person-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.person-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
}

@media (min-width: 768px) {
  .person-card {
    flex-direction: row;
    align-items: flex-start;
  }
}

.person-card-avatar {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.75rem;
  background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.person-card-body {
  flex: 1;
  min-width: 0;
}

.person-card-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
}

.link-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #0d6efd;
  text-decoration: none;
}

.link-name:hover {
  color: #0a58ca;
  text-decoration: underline;
}

.exp-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.skill-chip {
  font-weight: 500;
  padding: 0.4em 0.75em;
  background: rgba(13, 110, 253, 0.08);
  color: #084298;
  border: 1px solid rgba(13, 110, 253, 0.15);
}

.person-card-actions {
  padding-top: 0.25rem;
}

.btn-view {
  font-weight: 600;
  border-radius: 0.5rem;
}

.btn-icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.modal-footer {
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}
</style>
