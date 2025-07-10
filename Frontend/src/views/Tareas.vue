<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-4">
      <h1>Gestión de Tareas</h1>
      <button class="btn btn-primary" @click="openCreateModal">Crear Nueva Tarea</button>
    </div>

    <!-- Tabla de Tareas -->
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">Tarea</th>
              <th scope="col">Proyecto</th>
              <th scope="col">Asignada a</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>{{ task.name }}</td>
              <td>{{ getProjectName(task.projectId) }}</td>
              <td>{{ getPersonName(task.personId) }}</td>
              <td><span class="badge" :class="getStatusClass(task.status)">{{ task.status }}</span></td>
              <td>
                <button class="btn btn-sm btn-info">Detalles</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para Crear Tarea -->
    <div class="modal fade" id="createTaskModal" tabindex="-1" aria-labelledby="createTaskModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="createTaskModalLabel">Crear Nueva Tarea</h5>
            <button type="button" class="btn-close" @click="closeCreateModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createTask">
              <div class="mb-3">
                <label for="taskName" class="form-label">Nombre de la Tarea</label>
                <input type="text" class="form-control" id="taskName" v-model="newTask.name" required>
              </div>
               <div class="mb-3">
                <label for="taskProject" class="form-label">Proyecto</label>
                <select class="form-select" id="taskProject" v-model="newTask.projectId">
                  <option v-for="project in sampleProjects" :key="project.id" :value="project.id">{{ project.name }}</option>
                </select>
              </div>
               <div class="mb-3">
                <label for="taskPerson" class="form-label">Asignar a</label>
                <select class="form-select" id="taskPerson" v-model="newTask.personId">
                  <option v-for="person in samplePeople" :key="person.id" :value="person.id">{{ person.name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="taskStatus" class="form-label">Estado</label>
                <select class="form-select" id="taskStatus" v-model="newTask.status">
                  <option>Pendiente</option>
                  <option>En Progreso</option>
                  <option>Completada</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeCreateModal">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar Tarea</button>
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
  name: 'TareasView',
  data() {
    return {
      createModalInstance: null,
      tasks: [
        { id: 1, name: 'Diseñar la interfaz de login', projectId: 1, personId: 2, status: 'Completada' },
        { id: 2, name: 'Configurar la base de datos', projectId: 1, personId: 2, status: 'En Progreso' },
        { id: 3, name: 'Definir la arquitectura del backend', projectId: 1, personId: 1, status: 'Pendiente' },
        { id: 4, name: 'Investigar proveedores de nube', projectId: 2, personId: 1, status: 'Completada' },
      ],
      newTask: {
        name: '',
        projectId: 1,
        personId: 1,
        status: 'Pendiente'
      },
      // Datos de ejemplo para los selectores del formulario
      sampleProjects: [
        { id: 1, name: 'Sistema de Gestión de Tareas' },
        { id: 2, name: 'Migración a la Nube' }
      ],
      samplePeople: [
        { id: 1, name: 'Ana García' },
        { id: 2, name: 'Carlos Rodriguez' },
        { id: 3, name: 'Laura Martinez' }
      ]
    };
  },
  mounted() {
    this.createModalInstance = new Modal(document.getElementById('createTaskModal'));
  },
  methods: {
    openCreateModal() {
      this.createModalInstance.show();
    },
    closeCreateModal() {
      this.createModalInstance.hide();
    },
    createTask() {
      this.tasks.push({
        id: this.tasks.length + 1,
        ...this.newTask
      });
      this.closeCreateModal();
    },
    // Métodos para obtener nombres a partir de IDs
    getProjectName(id) {
      const project = this.sampleProjects.find(p => p.id === id);
      return project ? project.name : 'N/A';
    },
    getPersonName(id) {
      const person = this.samplePeople.find(p => p.id === id);
      return person ? person.name : 'N/A';
    },
    // Método para dar estilo al estado de la tarea
    getStatusClass(status) {
      if (status === 'Completada') return 'bg-success';
      if (status === 'En Progreso') return 'bg-warning text-dark';
      if (status === 'Pendiente') return 'bg-secondary';
      return 'bg-light';
    }
  }
}
</script>

<style scoped>
.btn-info {
    color: white;
}
</style>
