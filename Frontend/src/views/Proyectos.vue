<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>Gestión de Proyectos</h1>
      <button class="btn btn-primary" @click="openCreateModal">Crear Nuevo Proyecto</button>
    </div>

    <!-- Tabla de Proyectos -->
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">Nombre del Proyecto</th>
              <th scope="col">Fechas</th>
              <th scope="col">Dificultad</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.id">
              <td>{{ project.name }}</td>
              <td>{{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}</td>
              <td>{{ project.difficulty }}</td>
              <td><span class="badge" :class="getStatusClass(project.status)">{{ project.status }}</span></td>
              <td>
                <router-link :to="{ name: 'ProyectoDetalle', params: { id: project.id } }" class="btn btn-sm btn-info text-white">Ver</router-link>
                <button class="btn btn-sm btn-secondary ms-2" @click="openEditModal(project)">Editar</button>
                <button class="btn btn-sm btn-danger ms-2" @click="deleteProject(project.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para Crear/Editar Proyecto -->
    <div class="modal fade" id="projectModal" tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="projectModalLabel">{{ isEditMode ? 'Editar Proyecto' : 'Crear Nuevo Proyecto' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveProject">
              <div class="mb-3">
                <label for="projectName" class="form-label">Nombre del Proyecto</label>
                <input type="text" class="form-control" id="projectName" v-model="editableProject.name" required>
              </div>
              <div class="mb-3">
                <label for="projectDescription" class="form-label">Descripción</label>
                <textarea class="form-control" id="projectDescription" rows="3" v-model="editableProject.description"></textarea>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="projectStartDate" class="form-label">Fecha de Inicio</label>
                  <input type="date" class="form-control" id="projectStartDate" v-model="editableProject.startDate" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="projectEndDate" class="form-label">Fecha de Fin</label>
                  <input type="date" class="form-control" id="projectEndDate" v-model="editableProject.endDate" required>
                </div>
              </div>
               <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="projectDifficulty" class="form-label">Nivel de Dificultad</label>
                  <select class="form-select" id="projectDifficulty" v-model="editableProject.difficulty">
                    <option v-for="opt in difficultyOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="projectStatus" class="form-label">Estado</label>
                  <select class="form-select" id="projectStatus" v-model="editableProject.status">
                     <option v-for="opt in statusOptions" :key="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>
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
  name: 'ProyectosView',
  data() {
    return {
      modalInstance: null,
      isEditMode: false,
      projects: [
        {
          id: 1, name: 'Sistema de Gestión de Tareas', 
          description: 'Desarrollo de un nuevo sistema para la asignación automática de tareas.',
          startDate: '2025-07-01', endDate: '2025-12-31', difficulty: 'Alta', status: 'Activo'
        },
        {
          id: 2, name: 'Migración a la Nube', 
          description: 'Mover toda la infraestructura on-premise a servicios en la nube.',
          startDate: '2025-08-15', endDate: '2025-10-30', difficulty: 'Media', status: 'Activo'
        }
      ],
      editableProject: {},
      // Opciones para los selectores
      difficultyOptions: ['Baja', 'Media', 'Alta'],
      statusOptions: ['Activo', 'Pausado', 'Finalizado']
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('projectModal'));
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      // Sumar un día porque el input date puede tener problemas de zona horaria
      date.setDate(date.getDate() + 1);
      return date.toLocaleDateString('es-ES');
    },
    getStatusClass(status) {
      if (status === 'Activo') return 'bg-success';
      if (status === 'Pausado') return 'bg-warning text-dark';
      if (status === 'Finalizado') return 'bg-secondary';
      return 'bg-light';
    },
    // --- Métodos para el Modal ---
    openCreateModal() {
      this.isEditMode = false;
      this.editableProject = {
        name: '', description: '', startDate: '', endDate: '', 
        difficulty: 'Media', status: 'Activo'
      };
      this.modalInstance.show();
    },
    openEditModal(project) {
      this.isEditMode = true;
      this.editableProject = JSON.parse(JSON.stringify(project));
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    },
    saveProject() {
      if (this.editableProject.startDate > this.editableProject.endDate) {
        alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
      }

      if (this.isEditMode) {
        const index = this.projects.findIndex(p => p.id === this.editableProject.id);
        if (index !== -1) {
          this.projects[index] = this.editableProject;
        }
      } else {
        this.editableProject.id = Date.now();
        this.projects.push(this.editableProject);
      }
      this.closeModal();
    },
    deleteProject(projectId) {
      if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Las tareas asociadas no se eliminarán.')) {
        this.projects = this.projects.filter(p => p.id !== projectId);
      }
    }
  }
}
</script>
