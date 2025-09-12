<template>
  <div class="dashboard-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando dashboard...</p>
    </div>

    <!-- Admin Dashboard -->
    <div v-else-if="isUserAdmin" class="main-content">
      <!-- Welcome Message -->
      <div class="welcome-section">
        <h1 class="welcome-title">¡BIENVENIDO A LA GESTIÓN DE TU PROCESO!</h1>
      </div>

      <!-- Content Cards -->
      <div class="cards-container">
        <!-- Projects Card -->
        <div class="content-card projects-card" @click="navigateToProjects">
          <div class="card-label">TUS PROYECTOS:</div>
          <div class="card-icon">
            <i class="bi bi-folder2"></i>
          </div>
          <div class="card-info">
            <span class="project-count">{{ projectCount }}</span>
            <span class="info-text">proyectos activos</span>
          </div>
        </div>

        <!-- Developers Card -->
        <div class="content-card developers-card" @click="navigateToPersonas">
          <div class="card-label">TUS DESARROLLADORES:</div>
          <div class="card-icon">
            <i class="bi bi-people"></i>
          </div>
          <div class="card-info">
            <span class="developer-count">{{ developerCount }}</span>
            <span class="info-text">en el equipo</span>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-number">{{ adminCount }}</span>
              <span class="stat-label">Admins</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userCount }}</span>
              <span class="stat-label">Usuarios</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat-card">
          <i class="bi bi-clock-history"></i>
          <div class="stat-content">
            <h4>{{ totalHours }}</h4>
            <p>Horas Totales</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-check-circle"></i>
          <div class="stat-content">
            <h4>{{ completedTasks }}</h4>
            <p>Tareas Completadas</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-graph-up"></i>
          <div class="stat-content">
            <h4>{{ activeProjects }}</h4>
            <p>Proyectos Activos</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="action-btn proyecto-btn" @click="navigateToProjects">
          <i class="bi bi-plus-circle"></i>
          +Proyecto
        </button>
        <button class="action-btn desarrollador-btn" @click="navigateToPersonas">
          <i class="bi bi-plus-circle"></i>
          +Desarrollador
        </button>
      </div>
    </div>

    <!-- User Dashboard -->
    <div v-else-if="currentUser" class="user-dashboard">
      <!-- Welcome Message -->
      <div class="welcome-section">
        <h1 class="welcome-title">¡BIENVENIDO {{ currentUser?.nombre?.toUpperCase() }}!</h1>
        <p class="welcome-subtitle">Aquí tienes un resumen de tus proyectos y tareas asignadas</p>
      </div>

      <!-- User Stats -->
      <div class="user-stats">
        <div class="stat-card">
          <i class="bi bi-folder2-open"></i>
          <div class="stat-content">
            <h4>{{ myProjects.length }}</h4>
            <p>Proyectos Asignados</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-list-task"></i>
          <div class="stat-content">
            <h4>{{ myTasks.length }}</h4>
            <p>Tareas Pendientes</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-check-circle-fill"></i>
          <div class="stat-content">
            <h4>{{ completedTasksCount }}</h4>
            <p>Tareas Completadas</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-clock"></i>
          <div class="stat-content">
            <h4>{{ myAvailability }}h</h4>
            <p>Disponibilidad Semanal</p>
          </div>
        </div>
      </div>

      <!-- My Projects Section -->
      <div class="section">
        <div class="section-header">
          <h2><i class="bi bi-folder2-open me-2"></i>Mis Proyectos</h2>
          <button class="btn btn-outline-primary" @click="navigateToProjects">
            Ver Todos
          </button>
        </div>
        <div v-if="myProjects.length === 0" class="empty-state">
          <i class="bi bi-folder-x"></i>
          <p>No tienes proyectos asignados aún</p>
        </div>
        <div v-else class="projects-grid">
          <div v-for="project in myProjects.slice(0, 3)" :key="project._id" class="project-card" @click="viewProject(project._id)">
            <div class="project-header">
              <h3>{{ project.name }}</h3>
              <span class="badge" :class="getProjectStatusClass(project.status)">
                {{ project.status }}
              </span>
            </div>
            <p class="project-description">{{ project.description || 'Sin descripción' }}</p>
            <div class="project-meta">
              <span><i class="bi bi-calendar"></i> {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}</span>
              <span><i class="bi bi-flag"></i> {{ project.priority }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- My Tasks Section -->
      <div class="section">
        <div class="section-header">
          <h2><i class="bi bi-list-task me-2"></i>Mis Tareas</h2>
          <button class="btn btn-outline-primary" @click="navigateToTasks">
            Ver Todas
          </button>
        </div>
        <div v-if="myTasks.length === 0" class="empty-state">
          <i class="bi bi-list-check"></i>
          <p>No tienes tareas asignadas</p>
        </div>
        <div v-else class="tasks-list">
          <div v-for="task in myTasks.slice(0, 5)" :key="task._id" class="task-item">
            <div class="task-info">
              <h4>{{ task.descripcion }}</h4>
              <p class="task-project">{{ getProjectName(task.proyecto) }}</p>
            </div>
            <div class="task-meta">
              <span class="badge" :class="getTaskStatusClass(task.estado)">
                {{ getTaskStatusText(task.estado) }}
              </span>
              <span class="badge" :class="getTaskPriorityClass(task.prioridad)">
                {{ getTaskPriorityText(task.prioridad) }}
              </span>
              <span class="difficulty-badge">{{ task.nivelDificultad || 3 }}/5</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- No User State -->
    <div v-else class="no-user-container">
      <div class="no-user-content">
        <i class="bi bi-person-x"></i>
        <h2>No estás autenticado</h2>
        <p>Por favor, inicia sesión para acceder al dashboard</p>
        <button class="btn btn-primary" @click="navigateToLogin">
          Iniciar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ProjectService from '@/services/project.service.js';
import UserService from '@/services/user.service.js';
import TaskService from '@/services/task.service.js';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'DashboardView',
  data() {
    return {
      // Admin data
      projectCount: 0,
      developerCount: 0,
      adminCount: 0,
      userCount: 0,
      totalHours: 0,
      completedTasks: 0,
      activeProjects: 0,
      
      // User data
      myProjects: [],
      myTasks: [],
      completedTasksCount: 0,
      myAvailability: 0,
      
      // Common
      currentUser: null,
      allProjects: [],
      allUsers: [],
      isLoading: true
    };
  },
  computed: {
    isUserAdmin() {
      return AuthService.isAdmin(this.currentUser);
    }
  },
  async mounted() {
    try {
      await this.checkUserSession();
      if (this.currentUser) {
        await this.loadDashboardData();
      }
    } catch (error) {
      console.error('Error inicializando dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    async checkUserSession() {
      try {
        this.currentUser = await AuthService.checkSession();
        console.log('🔍 Dashboard - Usuario actual:', this.currentUser);
        console.log('🔍 Dashboard - Es admin?', this.isUserAdmin);
      } catch (error) {
        console.error('Error verificando sesión:', error);
        this.currentUser = null;
      }
    },
    async loadDashboardData() {
      try {
        if (this.isUserAdmin) {
          await this.loadAdminData();
        } else {
          await this.loadUserData();
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    },
    async loadAdminData() {
      try {
        // Cargar proyectos
        const projectsResponse = await ProjectService.getProjects();
        const projects = projectsResponse.data;
        this.projectCount = projects.length;
        this.activeProjects = projects.filter(p => p.status === 'Activo').length;

        // Cargar usuarios
        const usersResponse = await UserService.getUsers();
        const users = usersResponse.data;
        this.developerCount = users.length;
        this.adminCount = users.filter(u => u.rol === 'admin').length;
        this.userCount = users.filter(u => u.rol === 'user').length;

        // Calcular horas totales
        this.totalHours = users.reduce((total, user) => total + (user.disponibilidadSemanal || 0), 0);

        // Por ahora, establecer un valor por defecto para tareas completadas
        this.completedTasks = Math.floor(Math.random() * 50) + 20; // Simulado
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    },
    async loadUserData() {
      try {
        // Cargar todos los proyectos y usuarios para la asignación automática
        // Para usuarios normales, no podemos cargar todos los proyectos, así que los obtenemos de las tareas
        const usersResponse = await UserService.getUsers();
        this.allUsers = usersResponse.data;

        // Cargar tareas del usuario actual
        const tasksResponse = await TaskService.getTasksByDeveloper(this.currentUser._id);
        console.log('🔍 Dashboard - Respuesta de tareas del usuario:', tasksResponse);
        this.myTasks = tasksResponse || [];
        this.completedTasksCount = this.myTasks.filter(t => t.estado === 'completada').length;
        
        console.log('🔍 Dashboard - Tareas del usuario cargadas:', {
          total: this.myTasks.length,
          completadas: this.completedTasksCount,
          tareas: this.myTasks
        });

        // Obtener proyectos desde las tareas del usuario
        const projectIds = [...new Set(this.myTasks.map(task => task.proyecto))];
        console.log('🔍 Dashboard - IDs de proyectos de las tareas:', projectIds);
        
        // Cargar proyectos individualmente
        this.myProjects = [];
        for (const projectId of projectIds) {
          try {
            const projectResponse = await ProjectService.getProjectById(projectId);
            if (projectResponse && projectResponse.data) {
              this.myProjects.push(projectResponse.data);
              console.log('🔍 Dashboard - Proyecto cargado:', projectResponse.data.name);
            }
          } catch (error) {
            console.warn('🔍 Dashboard - Error cargando proyecto:', projectId, error);
          }
        }
        
        console.log('🔍 Dashboard - Proyectos del usuario cargados:', this.myProjects.length);

        // Disponibilidad del usuario
        this.myAvailability = this.currentUser.disponibilidadSemanal || 0;

        console.log('🔍 Dashboard - Datos del usuario cargados:', {
          myProjects: this.myProjects.length,
          myTasks: this.myTasks.length,
          completedTasks: this.completedTasksCount,
          availability: this.myAvailability
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    },
    // Navigation methods
    navigateToProjects() {
      this.$router.push({ name: 'Proyectos' });
    },
    navigateToPersonas() {
      this.$router.push({ name: 'Personas' });
    },
    navigateToTasks() {
      this.$router.push({ name: 'Tareas' });
    },
    viewProject(projectId) {
      this.$router.push({ name: 'ProyectoDetalle', params: { id: projectId } });
    },
    navigateToLogin() {
      this.$router.push({ name: 'Login' });
    },
    // Utility methods
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES');
    },
    getProjectName(projectId) {
      // Buscar en los proyectos del usuario primero
      const project = this.myProjects.find(p => p._id === projectId);
      if (project) {
        return project.name;
      }
      
      // Si no se encuentra, buscar en allProjects (para admins)
      const allProject = this.allProjects.find(p => p._id === projectId);
      return allProject ? allProject.name : 'Proyecto no encontrado';
    },
    getProjectStatusClass(status) {
      if (status === 'Activo') return 'bg-success';
      if (status === 'Pausado') return 'bg-warning text-dark';
      if (status === 'Finalizado') return 'bg-secondary';
      return 'bg-light';
    },
    getTaskStatusClass(status) {
      if (status === 'completada') return 'bg-success';
      if (status === 'en_progreso') return 'bg-primary';
      if (status === 'pendiente') return 'bg-warning text-dark';
      return 'bg-light';
    },
    getTaskStatusText(status) {
      const statusMap = {
        'completada': 'Completada',
        'en_progreso': 'En Progreso',
        'pendiente': 'Pendiente'
      };
      return statusMap[status] || status;
    },
    getTaskPriorityClass(priority) {
      if (priority === 'alta') return 'bg-danger';
      if (priority === 'media') return 'bg-warning text-dark';
      if (priority === 'baja') return 'bg-success';
      return 'bg-light';
    },
    getTaskPriorityText(priority) {
      const priorityMap = {
        'alta': 'Alta',
        'media': 'Media',
        'baja': 'Baja'
      };
      return priorityMap[priority] || priority;
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.loading-container p {
  color: #6c757d;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.no-user-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.no-user-content {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 400px;
}

.no-user-content i {
  font-size: 4rem;
  color: #6c757d;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-user-content h2 {
  color: #495057;
  margin-bottom: 1rem;
  font-weight: 600;
}

.no-user-content p {
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.5;
}

/* Main Content Area */
.main-content {
  padding: 0 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-title {
  color: #495057;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Content Cards */
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.content-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.content-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #007bff, #28a745);
}

.card-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-icon {
  margin-bottom: 1.5rem;
}

.card-icon i {
  font-size: 4rem;
  color: #007bff;
}

.projects-card .card-icon i {
  color: #28a745;
}

.developers-card .card-icon i {
  color: #fd7e14;
}

.card-info {
  margin-bottom: 1.5rem;
}

.project-count, .developer-count {
  display: block;
  font-size: 3rem;
  font-weight: 700;
  color: #007bff;
  line-height: 1;
}

.projects-card .project-count {
  color: #28a745;
}

.developers-card .developer-count {
  color: #fd7e14;
}

.info-text {
  color: #6c757d;
  font-size: 1rem;
}

.card-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #007bff;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  text-transform: uppercase;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card i {
  font-size: 2rem;
  color: #007bff;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 1rem;
  border-radius: 50%;
}

.stat-content h4 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #495057;
}

.stat-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.proyecto-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.proyecto-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.desarrollador-btn {
  background: linear-gradient(135deg, #fd7e14 0%, #ffc107 100%);
  color: white;
}

.desarrollador-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(253, 126, 20, 0.4);
}

/* User Dashboard Styles */
.user-dashboard {
  padding: 0 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.section-header h2 {
  margin: 0;
  color: #495057;
  font-size: 1.5rem;
  font-weight: 600;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.project-card:hover {
  transform: translateY(-2px);
  border-color: #007bff;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.project-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
}

.project-description {
  color: #6c757d;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.project-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.task-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.task-info h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.task-project {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.difficulty-badge {
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.assignment-results {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1rem;
}

.assignment-results h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.assignment-item {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.assignment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.assignment-info strong {
  color: #495057;
}

.assignment-score .badge {
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content, .user-dashboard {
    padding: 0 1rem;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .cards-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .content-card {
    padding: 1.5rem;
  }
  
  .quick-stats, .user-stats {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .action-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .assignment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
