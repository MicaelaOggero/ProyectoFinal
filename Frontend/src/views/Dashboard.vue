<template>
  <div class="dashboard-container">
    <!-- Main Content Area -->
    <div class="main-content">
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
  </div>
</template>

<script>
import ProjectService from '@/services/project.service.js';
import UserService from '@/services/user.service.js';
import AuthService from '@/services/auth.service.js';

export default {
  name: 'DashboardView',
  data() {
    return {
      projectCount: 0,
      developerCount: 0,
      adminCount: 0,
      userCount: 0,
      totalHours: 0,
      completedTasks: 0,
      activeProjects: 0,
      currentUser: null
    };
  },
  async mounted() {
    await this.checkUserSession();
    if (this.currentUser) {
      this.loadDashboardData();
    }
  },
  methods: {
    async checkUserSession() {
      try {
        this.currentUser = await AuthService.checkSession();
      } catch (error) {
        console.error('Error verificando sesión:', error);
        this.currentUser = null;
      }
    },
    async loadDashboardData() {
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
        console.error('Error loading dashboard data:', error);
      }
    },
    navigateToProjects() {
      this.$router.push({ name: 'Proyectos' });
    },
    navigateToPersonas() {
      this.$router.push({ name: 'Personas' });
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

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
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
  
  .quick-stats {
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
}
</style>
