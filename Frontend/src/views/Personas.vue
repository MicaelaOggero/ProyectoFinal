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
            <form @submit.prevent="savePerson">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="personName" class="form-label">Nombre Completo</label>
                  <input type="text" class="form-control" id="personName" v-model="editablePerson.name" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="personDni" class="form-label">DNI (Identificador Único)</label>
                  <input type="text" class="form-control" id="personDni" v-model="editablePerson.dni" required>
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
                  <label for="personAvailability" class="form-label">Disponibilidad Semanal (horas)</label>
                  <input type="number" class="form-control" id="personAvailability" v-model.number="editablePerson.availability" required>
                </div>
              </div>
               <div class="mb-3">
                  <label for="personCost" class="form-label">Costo por Hora ($)</label>
                  <input type="number" step="0.01" class="form-control" id="personCost" v-model.number="editablePerson.costPerHour" required>
                </div>

              <hr>
              <h5>Habilidades Técnicas</h5>
              <div v-for="(skill, index) in editablePerson.skills" :key="index" class="row align-items-center mb-2">
                <div class="col-md-4">
                  <select class="form-select" v-model="skill.name">
                    <option disabled value="">Seleccione una habilidad</option>
                    <option v-for="opt in skillOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                   <select class="form-select" v-model="skill.level">
                    <option disabled value="">Seleccione un nivel</option>
                    <option v-for="lvl in experienceLevels" :key="lvl">{{ lvl }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <input type="number" class="form-control" placeholder="Años" v-model.number="skill.yearsExperience" min="0" max="50">
                </div>
                <div class="col-md-2">
                  <button type="button" class="btn btn-sm btn-danger" @click="removeSkill(index)">Quitar</button>
                </div>
              </div>
              <button type="button" class="btn btn-sm btn-success mt-2" @click="addSkill">Añadir Habilidad</button>

              <div class="modal-footer mt-4">
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
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
      experienceLevels: ['Junior', 'Intermedio', 'Avanzado', 'Experto']
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('personModal'));
    this.loadUsers();
    this.loadSkills();
  },
  methods: {
    displaySkills(skills) {
      if (!skills || skills.length === 0) return 'N/A';
      return skills.map(s => `${s.nombre} (${s.nivel}, ${s.aniosExperiencia} años)`).join(', ');
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
        skills: [{ name: '', level: '', yearsExperience: 0 }]
      };
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
          name: skill.nombre,
          level: skill.nivel,
          yearsExperience: skill.aniosExperiencia
        }))
      };
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    savePerson() {
      if (this.isEditMode) {
        // Mapear los campos del frontend al backend
        const userData = {
          nombre: this.editablePerson.name,
          apellido: this.editablePerson.name.split(' ')[1] || '',
          habilidades: this.editablePerson.skills.map(skill => ({
            nombre: skill.name,
            nivel: skill.level,
            aniosExperiencia: skill.yearsExperience || 0
          })),
          disponibilidadSemanal: this.editablePerson.availability
        };
        
        // Lógica de Actualización
        UserService.updateUser(this.editablePerson._id, userData).then(() => {
          this.loadUsers();
          this.closeModal();
        }).catch(error => {
          console.error('Error updating user:', error);
        });
      } else {
        // Lógica de Creación - NOTA: Falta implementar la creación de usuarios en el backend
        // ya que requiere email y password, que no están en este formulario.
        console.error('La creación de usuarios no está implementada en este formulario.');
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
      this.editablePerson.skills.push({ name: '', level: '', yearsExperience: 0 });
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
