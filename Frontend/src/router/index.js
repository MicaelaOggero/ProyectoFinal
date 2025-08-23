
import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '@/views/Dashboard.vue';
import LoginView from '@/views/Login.vue';
import ProyectosView from '@/views/Proyectos.vue';
import ProyectoDetalleView from '@/views/ProyectoDetalle.vue';
import TareasView from '@/views/Tareas.vue';
import PersonasView from '@/views/Personas.vue';
import PerfilUsuarioView from '@/views/PerfilUsuario.vue';
import MiPerfilView from '@/views/MiPerfil.vue';
import GoogleCallbackView from '@/views/GoogleCallback.vue';
import AuthService from '@/services/auth.service.js';

const routes = [
  {
    path: '/',
    redirect: '/login'  // Cambiado: redirige a login por defecto
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }  // Solo usuarios NO autenticados
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/mi-perfil',
    name: 'MiPerfil',
    component: MiPerfilView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/google-callback',
    name: 'GoogleCallback',
    component: GoogleCallbackView
  },
  {
    path: '/proyectos',
    name: 'Proyectos',
    component: ProyectosView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/proyecto/:id',
    name: 'ProyectoDetalle',
    component: ProyectoDetalleView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/tareas',
    name: 'Tareas',
    component: TareasView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/personas',
    name: 'Personas',
    component: PersonasView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/perfil/:id',
    name: 'PerfilUsuario',
    component: PerfilUsuarioView,
    meta: { requiresAuth: true }  // Requiere autenticación
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Guard de navegación simplificado que funciona sin store
router.beforeEach(async (to, from, next) => {
  try {
    // Verificar si la ruta requiere autenticación
    if (to.meta.requiresAuth) {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        // No hay usuario autenticado, redirigir a login
        next('/login');
        return;
      }
      // Usuario autenticado, permitir acceso
      next();
      return;
    }

    // Verificar si la ruta es solo para invitados (como login)
    if (to.meta.requiresGuest) {
      const user = await AuthService.getCurrentUser();
      if (user) {
        // Usuario ya está autenticado, redirigir al dashboard
        next('/dashboard');
        return;
      }
      // Usuario no autenticado, permitir acceso a login
      next();
      return;
    }

    // Para rutas sin meta específica (como google-callback), permitir acceso
    next();
  } catch (error) {
    console.error('Error en guard de navegación:', error);
    // En caso de error, redirigir a login
    next('/login');
  }
});

export default router;
