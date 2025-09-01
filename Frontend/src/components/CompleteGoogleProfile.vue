<template>
  <div class="modal fade" id="completeProfileModal" tabindex="-1" aria-labelledby="completeProfileModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="completeProfileModalLabel">Completar Perfil - Registro con Google</h5>
        </div>
        <div class="modal-body">
          <div class="alert alert-info" role="alert">
            <i class="bi bi-info-circle me-2"></i>
            Has iniciado sesión con Google. Por favor completa la información faltante para continuar.
          </div>

          <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleCompleteProfile">
            <!-- Información del Usuario -->
            <div class="user-info-header mb-4">
              <div class="text-center">
                <div class="user-icon mb-3">
                  <i class="bi bi-person-workspace"></i>
                </div>
                <h5>Completar Perfil de Usuario</h5>
                <p class="text-muted">Completa tu información básica para continuar</p>
              </div>
            </div>

            <hr>

            <!-- Información Personal -->
            <h6 class="mb-3">Información Personal</h6>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="dni" class="form-label">DNI *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="dni" 
                  v-model="userData.dni" 
                  required
                  maxlength="8"
                  placeholder="12345678"
                >
                <div class="form-text">8 dígitos numéricos</div>
              </div>
              <div class="col-md-6 mb-3">
                <label for="aniosExperiencia" class="form-label">Años de Experiencia</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="aniosExperiencia" 
                  v-model="userData.aniosExperiencia" 
                  min="0"
                  max="50"
                  placeholder="0"
                >
              </div>
            </div>

                         <div class="row">
               <div class="col-md-6 mb-3">
                 <label for="disponibilidadSemanal" class="form-label">Disponibilidad Semanal (horas)</label>
                 <input 
                   type="number" 
                   class="form-control" 
                   id="disponibilidadSemanal" 
                   v-model="userData.disponibilidadSemanal" 
                   min="0"
                   max="168"
                   placeholder="40"
                 >
               </div>
               <div class="col-md-6 mb-3">
                 <label for="costoPorHora" class="form-label">Costo por Hora ($)</label>
                 <input 
                   type="number" 
                   class="form-control" 
                   id="costoPorHora" 
                   v-model="userData.costoPorHora" 
                   min="0"
                   step="0.01"
                   placeholder="0"
                 >
               </div>
             </div>

             <!-- Preferencias -->
             <div class="mb-3">
               <label for="preferencias" class="form-label">Preferencias de Trabajo</label>
               <textarea 
                 class="form-control" 
                 id="preferencias"
                 rows="3" 
                 placeholder="Describe tus preferencias de trabajo, tipo de proyectos que te gustan, etc."
                 v-model="userData.preferencias"
               ></textarea>
             </div>

            <!-- Habilidades -->
            <div class="mb-3">
              <label class="form-label">Habilidades *</label>
              <div class="skills-container">
                <div v-for="(skill, index) in userData.habilidades" :key="index" class="skill-item">
                  <div class="row">
                    <div class="col-md-6">
                      <input 
                        type="text" 
                        class="form-control" 
                        v-model="skill.nombre" 
                        placeholder="Nombre de la habilidad"
                        required
                      >
                    </div>
                    <div class="col-md-4">
                      <select class="form-select" v-model="skill.nivel" required>
                        <option value="">Nivel</option>
                        <option value="1">Principiante</option>
                        <option value="2">Básico</option>
                        <option value="3">Intermedio</option>
                        <option value="4">Avanzado</option>
                        <option value="5">Experto</option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <button type="button" class="btn btn-outline-danger btn-sm" @click="removeSkill(index)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-outline-primary btn-sm mt-2" @click="addSkill">
                <i class="bi bi-plus-circle me-1"></i>Agregar Habilidad
              </button>
            </div>



            <!-- Información de Completado -->
            <div class="alert alert-success">
              <i class="bi bi-check-circle me-2"></i>
              <strong>¡Casi listo!</strong> Una vez que completes tu perfil, tendrás acceso completo al sistema.
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                Completar Perfil y Continuar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'CompleteGoogleProfile',
  data() {
    return {
      modalInstance: null,
             userData: {
         dni: '',
         rol: 'user', // Siempre será 'user'
         aniosExperiencia: 0,
         disponibilidadSemanal: 40,
         costoPorHora: 0,
         preferencias: '',
         habilidades: []
       },
      errorMessage: '',
      loading: false
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('completeProfileModal'));
    // Agregar primera habilidad por defecto
    this.addSkill();
  },
  methods: {
    show() {
      this.errorMessage = '';
      this.resetForm();
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
         resetForm() {
       this.userData = {
         dni: '',
         rol: 'user', // Siempre será 'user'
         aniosExperiencia: 0,
         disponibilidadSemanal: 40,
         costoPorHora: 0,
         preferencias: '',
         habilidades: []
       };
       this.addSkill(); // Agregar primera habilidad
     },
    addSkill() {
      this.userData.habilidades.push({
        nombre: '',
        nivel: ''
      });
    },
    removeSkill(index) {
      if (this.userData.habilidades.length > 1) {
        this.userData.habilidades.splice(index, 1);
      }
    },
    async handleCompleteProfile() {
      this.loading = true;
      this.errorMessage = '';
      
      try {
        // Validar campos requeridos
        if (!this.userData.dni) {
          throw new Error('Por favor completa todos los campos requeridos');
        }

        // Validar DNI
        if (this.userData.dni.length !== 8 || isNaN(this.userData.dni)) {
          throw new Error('El DNI debe tener 8 dígitos numéricos');
        }

        // Validar habilidades
        if (this.userData.habilidades.length === 0) {
          throw new Error('Debes agregar al menos una habilidad');
        }

        for (let skill of this.userData.habilidades) {
          if (!skill.nombre || !skill.nivel) {
            throw new Error('Por favor completa todas las habilidades');
          }
        }

        // Completar perfil en el backend
        await AuthService.completeGoogleProfile(this.userData);
        
        // Cerrar modal y emitir evento de éxito
        this.closeModal();
        this.$emit('profile-completed');
        
      } catch (error) {
        this.errorMessage = error.response?.data?.error || error.message || 'Error al completar perfil';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.modal-xl {
  max-width: 1000px;
}

.user-info-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.user-icon {
  font-size: 3rem;
  color: #007bff;
}

.skills-container {
  max-height: 300px;
  overflow-y: auto;
}

.skill-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert-warning {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}
</style>
