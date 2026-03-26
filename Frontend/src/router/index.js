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
import AssignmentSummaryView from '@/views/AssignmentSummaryView.vue';
import ResetPasswordView from '@/views/ResetPassword.vue';
import ReportesView from '@/views/Reportes.vue';
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
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView
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
  },
  {
    path: '/asignacion-resumen',
    name: 'AssignmentSummary',
    component: AssignmentSummaryView,
    meta: { requiresAuth: true }  // Requiere autenticación
  },
  {
    path: '/reportes',
    name: 'Reportes',
    component: ReportesView,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Guard de navegación simplificado que funciona sin store
router.beforeEach(async (to, from, next) => {
  // Sólo proteger si la ruta lo pide explícitamente
  if (!to.meta?.requiresAuth) {
    return next();
  }

  const requiresAdmin = !!to.meta?.requiresAdmin;

  // 1) Intento con login normal (token en localStorage)
  try {
    const user = await AuthService.getCurrentUser();
    if (user) {
      if (requiresAdmin && !AuthService.isAdmin(user)) {
        return next('/dashboard');
      }
      return next();
    }
  } catch (error) {
    // Silently continue to Google auth check
  }

  // 2) Intento con sesión Google (cookie httpOnly)
  try {
    const g = await AuthService.getCurrentUserGoogle();
    const googleUser = g?.user || g;
    if (googleUser) {
      if (requiresAdmin && !AuthService.isAdmin(googleUser)) {
        return next('/dashboard');
      }
      return next();
    }
  } catch (error) {
    // Silently continue to redirect
  }

  return next('/login');
});


export default router;