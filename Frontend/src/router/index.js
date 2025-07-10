
import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import LoginView from '@/views/Login.vue';
import DashboardView from '@/views/Dashboard.vue';
import ProyectosView from '@/views/Proyectos.vue';
import ProyectoDetalleView from '@/views/ProyectoDetalle.vue';
import TareasView from '@/views/Tareas.vue';
import PersonasView from '@/views/Personas.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView
      },
      {
        path: 'proyectos',
        name: 'Proyectos',
        component: ProyectosView
      },
      {
        path: 'proyectos/:id',
        name: 'ProyectoDetalle',
        component: ProyectoDetalleView
      },
      {
        path: 'tareas',
        name: 'Tareas',
        component: TareasView
      },
      {
        path: 'personas',
        name: 'Personas',
        component: PersonasView
      }
    ]
  },
  // Redirección para cualquier ruta no encontrada
  { 
    path: '/:catchAll(.*)', 
    redirect: '/login' 
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
