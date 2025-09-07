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
              <th scope="col">Habilidades</th>
              <th scope="col">Años Exp.</th>
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
              <td>{{ displaySkills(person.habilidades) }}</td>
              <td>{{ person.aniosExperiencia || 'N/A' }}</td>
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
              <div class="row">
                 
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
              <div class="alert alert-info mb-3" v-if="isEditMode">
                <strong>Debug - Habilidades cargadas:</strong> {{ editablePerson.skills.length }} habilidades
                <br>
                <small>{{ JSON.stringify(editablePerson.skills) }}</small>
              </div>
              <div v-for="(skill, index) in editablePerson.skills" :key="index" class="row align-items-center mb-2">
                <div class="col-md-6">
                  <select 
                    class="form-select" 
                    :class="{ 'is-invalid': hasFieldError(`skill_${index}_name`) }"
                    v-model="skill.name"
                  >
                    <option disabled value="">Seleccione una habilidad</option>
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
      return skills.map(s => `${s.nombre} (Nivel ${s.nivel}/5)`).join(', ');
    },
    loadUsers() {
      UserService.getUsers().then(response => {
        console.log('Usuarios cargados:', response.data);
        this.people = response.data;
      }).catch(error => {
        console.error('Error loading users:', error);
        const errorMessage = error.response?.data?.error || 'Error al cargar usuarios';
        this.$toast?.error(errorMessage) || alert(errorMessage);
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
        skills: [{ name: '', level: '1' }]
      };
      this.clearValidationErrors();
      this.modalInstance.show();
    },
    openEditModal(person) {
      this.isEditMode = true;
      console.log('Editando persona:', person);
      
      // Mapear los campos correctamente desde el backend al frontend
      this.editablePerson = {
        _id: person._id,
        name: person.nombre || '',
        dni: person.dni || '',
        role: person.rol || 'Desarrollador',
        availability: person.disponibilidadSemanal || 40,
        costPerHour: person.costoPorHora || 0,
        yearsExperience: person.aniosExperiencia || 0,
        skills: (person.habilidades && person.habilidades.length > 0) 
          ? person.habilidades.map(skill => ({
              name: skill.nombre || '',
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
      console.log('🔍 Primera habilidad - name:', this.editablePerson.skills[0]?.name, 'level:', this.editablePerson.skills[0]?.level, 'tipo:', typeof this.editablePerson.skills[0]?.level);
      console.log('🔍 Opciones de habilidades disponibles:', this.skillOptions);
      console.log('🔍 ¿Coincide "Frontend" con las opciones?', this.skillOptions.includes('Frontend'));
      console.log('🔍 ¿Coincide "React" con las opciones?', this.skillOptions.includes('React'));
      console.log('🔍 Campos disponibles en el backend:', Object.keys(person));
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
        userData.disponibilidadSemanal = parseInt(this.editablePerson.availability) || 40;
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
