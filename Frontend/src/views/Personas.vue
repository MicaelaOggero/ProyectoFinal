<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>Gestión de Personas</h1>
      <button class="btn btn-primary" @click="openCreateModal">Añadir Nueva Persona</button>
    </div>

    <!-- Tabla de Personas -->
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">DNI</th>
              <th scope="col">Rol</th>
              <th scope="col">Habilidades</th>
              <th scope="col">Disponibilidad (hs/sem)</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in people" :key="person._id">
              <td>
                <a href="#" @click.prevent="viewProfile(person)" class="text-decoration-none fw-bold text-primary">
                  {{ person.nombre }} {{ person.apellido }}
                </a>
              </td>
              <td>{{ person.dni }}</td>
              <td>{{ person.rol }}</td>
              <td>{{ displaySkills(person.habilidades) }}</td>
              <td>{{ person.disponibilidadSemanal }}</td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="openEditModal(person)">Editar</button>
                <button class="btn btn-sm btn-danger ms-2" @click="deletePerson(person._id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
                  <label for="personDni" class="form-label">DNI *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :class="{ 'is-invalid': hasFieldError('dni') }"
                    id="personDni" 
                    v-model="editablePerson.dni" 
                    required
                    placeholder="Ej: 43844509"
                    maxlength="8"
                    @input="validateDniInput"
                  >
                  <div class="invalid-feedback" v-if="hasFieldError('dni')">
                    {{ getFieldError('dni') }}
                  </div>
                </div>
              </div>
              <div class="row">
                 <div class="col-md-6 mb-3">
                  <label for="personRole" class="form-label">Rol</label>
                  <select class="form-select" id="personRole" v-model="editablePerson.role">
                    <option>Desarrollador</option>
                    <option>Líder de Proyecto</option>
                    <option>Tester</option>
                    <option>Diseñador UX/UI</option>
                    <option>Administrador</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="personAvailability" class="form-label">Disponibilidad Semanal (horas) *</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    :class="{ 'is-invalid': hasFieldError('availability') }"
                    id="personAvailability" 
                    v-model.number="editablePerson.availability" 
                    required
                    min="1"
                    max="168"
                    placeholder="Ej: 40"
                  >
                  <div class="invalid-feedback" v-if="hasFieldError('availability')">
                    {{ getFieldError('availability') }}
                  </div>
                </div>
              </div>
              
              <hr>
              <h5>Habilidades Técnicas *</h5>
              <div v-if="hasFieldError('skills')" class="alert alert-danger">
                {{ getFieldError('skills') }}
              </div>
              <div v-for="(skill, index) in editablePerson.skills" :key="index" class="row align-items-center mb-2">
                <div class="col-md-6">
                  <select 
                    class="form-select" 
                    :class="{ 'is-invalid': hasFieldError(`skill_${index}_name`) }"
                    v-model="skill.name"
                  >
                    <option disabled value="">Seleccione una habilidad</option>
                    <option v-for="opt in skillOptions" :key="opt">{{ opt }}</option>
                  </select>
                  <div class="invalid-feedback" v-if="hasFieldError(`skill_${index}_name`)">
                    {{ getFieldError(`skill_${index}_name`) }}
                  </div>
                </div>
                <div class="col-md-4">
                  <input 
                    type="number" 
                    class="form-control" 
                    :class="{ 'is-invalid': hasFieldError(`skill_${index}_experience`) }"
                    placeholder="Años de experiencia" 
                    v-model.number="skill.yearsExperience" 
                    min="0" 
                    max="50"
                  >
                  <div class="invalid-feedback" v-if="hasFieldError(`skill_${index}_experience`)">
                    {{ getFieldError(`skill_${index}_experience`) }}
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

export default {
  name: 'PersonasView',
  data() {
    return {
      modalInstance: null,
      isEditMode: false,
      people: [],
      editablePerson: { skills: [] },
      // Datos predefinidos
      skillOptions: [],
      // Validaciones
      validationErrors: {},
      isSubmitting: false
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('personModal'));
    this.loadUsers();
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

      // Validar DNI (solo números, 7 u 8 dígitos)
      if (!this.editablePerson.dni || this.editablePerson.dni.toString().trim() === '') {
        this.validationErrors.dni = 'El DNI es requerido';
        isValid = false;
      } else if (!/^\d{7,8}$/.test(this.editablePerson.dni.toString().trim())) {
        this.validationErrors.dni = 'El DNI debe contener solo números (7 u 8 dígitos)';
        isValid = false;
      }

      // Validar disponibilidad semanal
      if (!this.editablePerson.availability || this.editablePerson.availability <= 0) {
        this.validationErrors.availability = 'La disponibilidad semanal es requerida y debe ser mayor a 0';
        isValid = false;
      } else if (this.editablePerson.availability > 168) { // 24 * 7 = 168 horas por semana
        this.validationErrors.availability = 'La disponibilidad semanal no puede exceder 168 horas';
        isValid = false;
      }

      // Validar costo por hora
      if (!this.editablePerson.costPerHour || this.editablePerson.costPerHour <= 0) {
        this.validationErrors.costPerHour = 'El costo por hora es requerido y debe ser mayor a 0';
        isValid = false;
      }

      // Validar habilidades
      if (!this.editablePerson.skills || this.editablePerson.skills.length === 0) {
        this.validationErrors.skills = 'Debe agregar al menos una habilidad';
        isValid = false;
      } else {
        for (let i = 0; i < this.editablePerson.skills.length; i++) {
          const skill = this.editablePerson.skills[i];
          if (!skill.name || skill.name.trim() === '') {
            this.validationErrors[`skill_${i}_name`] = 'Debe seleccionar una habilidad';
            isValid = false;
          }
          if (skill.yearsExperience < 0 || skill.yearsExperience > 50) {
            this.validationErrors[`skill_${i}_experience`] = 'Los años de experiencia deben estar entre 0 y 50';
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
      
      // Actualizar el modelo
      this.editablePerson.dni = input.value;
      
      // Limpiar error si ya es válido
      if (this.validationErrors.dni && /^\d{7,8}$/.test(input.value)) {
        delete this.validationErrors.dni;
      }
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

    clearValidationErrors() {
      this.validationErrors = {};
    },

    getFieldError(fieldName) {
      return this.validationErrors[fieldName] || '';
    },

    hasFieldError(fieldName) {
      return !!this.validationErrors[fieldName];
    },

    displaySkills(skills) {
      if (!skills || skills.length === 0) return 'N/A';
      return skills.map(s => `${s.nombre} (${s.aniosExperiencia} años)`).join(', ');
    },
    loadUsers() {
      UserService.getUsers().then(response => {
        this.people = response.data;
      }).catch(error => {
        console.error('Error loading users:', error);
      });
    },
    loadSkills() {
      SkillsService.getSkills().then(response => {
        this.skillOptions = response.data.map(skill => skill.nombre);
      }).catch(error => {
        console.error('Error loading skills:', error);
        // Fallback a opciones predefinidas si falla la carga
        this.skillOptions = ['JavaScript', 'Vue.js', 'Node.js', 'SQL', 'HTML & CSS', 'Python', 'Diseño UI'];
      });
    },
    // --- Métodos para el Modal ---
    openCreateModal() {
      this.isEditMode = false;
      this.editablePerson = {
        name: '', dni: '', role: 'Desarrollador', availability: 40, costPerHour: 20,
        skills: [{ name: '', yearsExperience: 0 }]
      };
      this.clearValidationErrors();
      this.modalInstance.show();
    },
    openEditModal(person) {
      this.isEditMode = true;
      // Mapear los campos correctamente desde el backend al frontend
      this.editablePerson = {
        _id: person._id,
        name: person.nombre,
        dni: person.dni,
        role: person.rol,
        availability: person.disponibilidadSemanal,
        costPerHour: person.costoPorHora,
        skills: (person.habilidades || []).map(skill => ({
          name: skill.name,
          yearsExperience: skill.aniosExperiencia
        }))
      };
      this.clearValidationErrors();
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    savePerson() {
      // Limpiar errores previos
      this.clearValidationErrors();
      
      // Validar formulario
      if (!this.validateForm()) {
        return; // No continuar si hay errores de validación
      }

      // Prevenir múltiples envíos
      if (this.isSubmitting) {
        return;
      }

      this.isSubmitting = true;

      if (this.isEditMode) {
        // Mapear los campos del frontend al backend
        const userData = {
          nombre: this.editablePerson.name,
          apellido: this.editablePerson.name.split(' ')[1] || '',
          habilidades: this.editablePerson.skills.map(skill => ({
            nombre: skill.name,
            aniosExperiencia: skill.yearsExperience || 0
          })),
          disponibilidadSemanal: this.editablePerson.availability
        };
        
        // Lógica de Actualización
        UserService.updateUser(this.editablePerson._id, userData).then(() => {
          this.loadUsers();
          this.closeModal();
          this.isSubmitting = false;
        }).catch(error => {
          console.error('Error updating user:', error);
          this.isSubmitting = false;
        });
      } else {
        // Lógica de Creación - NOTA: Falta implementar la creación de usuarios en el backend
        // ya que requiere email y password, que no están en este formulario.
        console.error('La creación de usuarios no está implementada en este formulario.');
        this.isSubmitting = false;
      }
    },
    deletePerson(personId) {
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
      this.editablePerson.skills.push({ name: '', yearsExperience: 0 });
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
