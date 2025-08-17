
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

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView
  },
  {
    path: '/mi-perfil',
    name: 'MiPerfil',
    component: MiPerfilView
  },
  {
    path: '/google-callback',
    name: 'GoogleCallback',
    component: GoogleCallbackView
  },
  {
    path: '/proyectos',
    name: 'Proyectos',
    component: ProyectosView
  },
  {
    path: '/proyecto/:id',
    name: 'ProyectoDetalle',
    component: ProyectoDetalleView
  },
  {
    path: '/tareas',
    name: 'Tareas',
    component: TareasView
  },
  {
    path: '/personas',
    name: 'Personas',
    component: PersonasView
  },
  {
    path: '/perfil/:id',
    name: 'PerfilUsuario',
    component: PerfilUsuarioView
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
