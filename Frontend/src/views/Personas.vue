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
            <tr v-for="person in people" :key="person.id">
              <td>{{ person.name }}</td>
              <td>{{ person.dni }}</td>
              <td>{{ person.role }}</td>
              <td>{{ displaySkills(person.skills) }}</td>
              <td>{{ person.availability }}</td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="openEditModal(person)">Editar</button>
                <button class="btn btn-sm btn-danger ms-2" @click="deletePerson(person.id)">Eliminar</button>
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
                <div class="col-md-5">
                  <select class="form-select" v-model="skill.name">
                    <option disabled value="">Seleccione una habilidad</option>
                    <option v-for="opt in skillOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-5">
                   <select class="form-select" v-model="skill.level">
                    <option disabled value="">Seleccione un nivel</option>
                    <option v-for="lvl in experienceLevels" :key="lvl">{{ lvl }}</option>
                  </select>
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

export default {
  name: 'PersonasView',
  data() {
    return {
      modalInstance: null,
      isEditMode: false,
      people: [
        {
          id: 1, name: 'Ana García', dni: '25123456', role: 'Líder de Proyecto', 
          skills: [{name: 'Vue.js', level: 'Avanzado'}, {name: 'Node.js', level: 'Avanzado'}],
          availability: 40, costPerHour: 50
        },
        {
          id: 2, name: 'Carlos Rodriguez', dni: '30789012', role: 'Desarrollador', 
          skills: [{name: 'Vue.js', level: 'Intermedio'}, {name: 'SQL', level: 'Junior'}],
          availability: 35, costPerHour: 35
        }
      ],
      editablePerson: { skills: [] },
      // Datos predefinidos
      skillOptions: ['JavaScript', 'Vue.js', 'Node.js', 'SQL', 'HTML & CSS', 'Python', 'Diseño UI'],
      experienceLevels: ['Junior', 'Intermedio', 'Avanzado', 'Experto']
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('personModal'));
  },
  methods: {
    displaySkills(skills) {
      if (!skills || skills.length === 0) return 'N/A';
      return skills.map(s => `${s.name} (${s.level})`).join(', ');
    },
    // --- Métodos para el Modal ---
    openCreateModal() {
      this.isEditMode = false;
      this.editablePerson = {
        name: '', dni: '', role: 'Desarrollador', availability: 40, costPerHour: 20,
        skills: []
      };
      this.modalInstance.show();
    },
    openEditModal(person) {
      this.isEditMode = true;
      // Clonar el objeto para no modificar el original hasta guardar
      this.editablePerson = JSON.parse(JSON.stringify(person));
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    savePerson() {
      if (this.isEditMode) {
        // Lógica de Actualización
        const index = this.people.findIndex(p => p.id === this.editablePerson.id);
        if (index !== -1) {
          this.people[index] = this.editablePerson;
        }
      } else {
        // Lógica de Creación
        this.editablePerson.id = Date.now(); // ID simple para el ejemplo
        this.people.push(this.editablePerson);
      }
      this.closeModal();
    },
    deletePerson(personId) {
      if (window.confirm('¿Estás seguro de que quieres eliminar a esta persona?')) {
        this.people = this.people.filter(p => p.id !== personId);
      }
    },
    // --- Métodos para Habilidades ---
    addSkill() {
      this.editablePerson.skills.push({ name: '', level: '' });
    },
    removeSkill(index) {
      this.editablePerson.skills.splice(index, 1);
    }
  }
}
</script>
