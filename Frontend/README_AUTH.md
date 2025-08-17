# Sistema de Autenticación - Frontend

## Funcionalidades Implementadas

### 1. Login Tradicional
- Formulario de inicio de sesión con email y contraseña
- Validación de campos requeridos
- Manejo de errores del backend
- Redirección automática después del login exitoso

### 2. Registro Tradicional
- Formulario completo de registro con todos los campos requeridos
- Validación de campos (DNI de 8 dígitos, contraseña mínima de 6 caracteres)
- Campos opcionales para información profesional
- Mensaje de éxito y cambio automático a la pestaña de login

### 3. Autenticación con Google
- Botón de "Continuar con Google" tanto para login como registro
- Integración con el backend que ya tiene configurado Passport.js
- Redirección automática al flujo de OAuth de Google

## Estructura de Archivos

### Componentes
- `LoginModal.vue` - Modal de login con opciones de Google y enlace al registro
- `RegisterModal.vue` - Modal de registro con opciones de Google y formulario tradicional

### Servicios
- `auth.service.js` - Servicio actualizado con métodos de registro y autenticación Google

### Vistas
- `Login.vue` - Vista principal con tabs para login y registro

## Campos del Formulario de Registro

### Campos Requeridos (*)
- **DNI**: 8 dígitos numéricos
- **Nombre**: Nombre del usuario
- **Apellido**: Apellido del usuario
- **Rol**: Selección entre "desarrollador" o "admin"
- **Email**: Email válido y único
- **Contraseña**: Mínimo 6 caracteres

### Campos Opcionales
- **Años de Experiencia**: Número entre 0 y 50
- **Disponibilidad Semanal**: Horas disponibles por semana (0-168)
- **Costo por Hora**: Tarifa en dólares
- **Preferencias de Trabajo**: Descripción de preferencias

## Flujo de Usuario

### Registro
1. Usuario accede a la vista de Login
2. Cambia a la pestaña "Registrarse"
3. Elige entre Google OAuth o formulario tradicional
4. Si elige Google: se redirige al flujo de OAuth
5. Si elige formulario: completa los campos y envía
6. Recibe confirmación de éxito y se cambia automáticamente a login

### Login
1. Usuario accede a la vista de Login
2. Elige entre Google OAuth o formulario tradicional
3. Si elige Google: se redirige al flujo de OAuth
4. Si elige formulario: ingresa email y contraseña
5. Se autentica y redirige a la vista de proyectos

## Integración con Backend

### Endpoints Utilizados
- `POST /api/session/register` - Registro de usuarios
- `POST /api/session/login` - Login tradicional
- `GET /api/session/auth/google` - Inicio de autenticación Google
- `GET /api/session/auth/google/callback` - Callback de Google (manejado por backend)

### Manejo de Sesiones
- El backend maneja las sesiones con cookies
- Axios está configurado para incluir cookies automáticamente
- La autenticación se mantiene entre navegaciones

## Estilos y UI/UX

### Características de Diseño
- Diseño responsive con Bootstrap 5
- Tabs para alternar entre login y registro
- Botones de Google con el logo oficial
- Validación visual de formularios
- Mensajes de error y éxito claros
- Gradientes y sombras modernas

### Responsive Design
- Adaptación automática para dispositivos móviles
- Layout de columnas que se apila en pantallas pequeñas
- Botones y formularios optimizados para touch

## Configuración

### Variables de Entorno (Opcional)
```bash
# .env
VUE_APP_API_URL=http://localhost:8080/api
```

### Dependencias
- Vue.js 3
- Bootstrap 5
- Axios
- Vue Router

## Notas Importantes

1. **Backend Requerido**: El backend debe estar ejecutándose en `http://localhost:8080` o configurado en las variables de entorno
2. **Google OAuth**: El backend ya tiene configurado Passport.js con Google OAuth
3. **CORS**: El backend debe permitir requests desde el frontend
4. **Cookies**: Las sesiones se manejan con cookies, asegúrate de que el backend esté configurado correctamente

## Próximas Mejoras

- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Perfil de usuario editable
- [ ] Historial de sesiones
- [ ] Autenticación de dos factores
- [ ] Integración con más proveedores OAuth (GitHub, LinkedIn, etc.)
