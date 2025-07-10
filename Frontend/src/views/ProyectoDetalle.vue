<template>
  <div class="container-fluid mt-3">
    <div v-if="project">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1>{{ project.name }}</h1>
          <p class="lead">{{ project.description }}</p>
        </div>
        <router-link to="/proyectos" class="btn btn-secondary">Volver a Proyectos</router-link>
      </div>
      <hr>
      
      <h3>Tareas del Proyecto</h3>
      <div class="card mt-3">
        <div class="card-body">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Tarea</th>
                <th scope="col">Asignada a</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="projectTasks.length === 0">
                <td colspan="3" class="text-center">No hay tareas asignadas a este proyecto.</td>
              </tr>
              <tr v-for="task in projectTasks" :key="task.id">
                <td>{{ task.name }}</td>
                <td>{{ getPersonName(task.personId) }}</td>
                <td><span class="badge" :class="getStatusClass(task.status)">{{ task.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    <div v-else>
      <p class="text-center">Proyecto no encontrado o cargando...</p>
      <div class="text-center">
        <router-link to="/proyectos" class="btn btn-secondary mt-3">Volver a Proyectos</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProyectoDetalleView',
  data() {
    return {
      project: null,
      // Datos de ejemplo que simularían una base de datos global o una llamada a la API
      allProjects: [
        { id: 1, name: 'Sistema de Gestión de Tareas', description: 'Desarrollo de un nuevo sistema para la asignación automática de tareas.' },
        { id: 2, name: 'Migración a la Nube', description: 'Mover toda la infraestructura on-premise a servicios en la nube.' },
        { id: 3, name: 'Nuevo CRM Interno', description: 'Creación de un nuevo CRM para el equipo de ventas.' }
      ],
      allTasks: [
        { id: 1, name: 'Diseñar la interfaz de login', projectId: 1, personId: 2, status: 'Completada' },
        { id: 2, name: 'Configurar la base de datos', projectId: 1, personId: 2, status: 'En Progreso' },
        { id: 3, name: 'Definir la arquitectura del backend', projectId: 1, personId: 1, status: 'Pendiente' },
        { id: 4, name: 'Investigar proveedores de nube', projectId: 2, personId: 1, status: 'Completada' },
        { id: 5, name: 'Crear mockups de la interfaz', projectId: 3, personId: null, status: 'Pendiente' }
      ],
      allPeople: [
        { id: 1, name: 'Ana García' },
        { id: 2, name: 'Carlos Rodriguez' },
        { id: 3, name: 'Laura Martinez' }
      ]
    };
  },
  computed: {
    projectTasks() {
      if (!this.project) return [];
      return this.allTasks.filter(task => task.projectId === this.project.id);
    }
  },
  created() {
    const projectId = parseInt(this.$route.params.id, 10);
    this.project = this.allProjects.find(p => p.id === projectId);
  },
  methods: {
    getPersonName(id) {
      if (id === null) return 'Sin asignar';
      const person = this.allPeople.find(p => p.id === id);
      return person ? person.name : 'Desconocido';
    },
    getStatusClass(status) {
      if (status === 'Completada') return 'bg-success';
      if (status === 'En Progreso') return 'bg-warning text-dark';
      if (status === 'Pendiente') return 'bg-secondary';
      return 'bg-light';
    }
  }
}
</script>
