# Flujo Completo de Autenticación con Google - Frontend

## Problema Resuelto

Antes, cuando un usuario se registraba con Google, recibía un error "cannot/error" porque:
1. El perfil no estaba completo (faltaban campos requeridos como DNI, rol, etc.)
2. No había un flujo para completar la información faltante
3. No había manejo de aprobación del administrador
4. No había redirección apropiada después del callback

## Solución Implementada

### 1. Nuevos Componentes

#### `CompleteGoogleProfile.vue`
- Modal para completar información faltante después de Google OAuth
- Campos requeridos: DNI, Rol
- Campos opcionales: Años de experiencia, disponibilidad, costo por hora, preferencias
- Validación de campos
- Integración con el backend para actualizar el perfil

#### `ApprovalPending.vue`
- Modal informativo para usuarios que esperan aprobación del administrador
- Explica el proceso de aprobación
- Diseño atractivo con animaciones

#### `GoogleCallback.vue`
- Vista principal que maneja todo el flujo después del callback de Google
- Estados: Loading, Error, Necesita completar perfil, Pendiente de aprobación, Éxito
- Redirección automática al dashboard una vez aprobado

### 2. Servicio de Autenticación Actualizado

#### Nuevos Métodos
- `completeGoogleProfile(profileData)` - Completa el perfil del usuario
- `checkProfileCompletion()` - Verifica si el perfil está completo

### 3. Flujo de Usuario Completo

```
1. Usuario hace clic en "Continuar con Google"
2. Se redirige a Google OAuth
3. Google redirige de vuelta al backend
4. Backend crea/actualiza usuario y establece sesión
5. Backend redirige al frontend a /google-callback
6. Frontend verifica el estado del usuario:
   a. Si el perfil está incompleto → Muestra modal para completar
   b. Si el perfil está completo pero es usuario → Muestra mensaje de espera
   c. Si es admin o está aprobado → Redirige al dashboard
7. Usuario completa perfil si es necesario
8. Usuario espera aprobación del administrador
9. Una vez aprobado → Acceso completo al sistema
```

## Configuración del Backend Requerida

### 1. Modificar el Callback de Google

El backend debe redirigir al frontend después del callback exitoso:

```javascript
// En session.routes.js, línea ~220
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Redirigir al frontend en lugar de al backend
    res.redirect('http://localhost:3000/google-callback');
  }
);
```

### 2. Nuevo Endpoint para Completar Perfil

Agregar en el backend:

```javascript
// Completar perfil después de Google OAuth
router.put('/complete-profile', auth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { dni, rol, aniosExperiencia, disponibilidadSemanal, preferencias, costoPorHora } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        dni, 
        rol, 
        aniosExperiencia, 
        disponibilidadSemanal, 
        preferencias, 
        costoPorHora,
        // Marcar como pendiente de aprobación si es usuario
        approved: rol === 'admin' ? true : false
      },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Perfil completado', usuario: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Error al completar perfil' });
  }
});
```

### 3. Campo de Aprobación en el Modelo de Usuario

Agregar al modelo de usuario:

```javascript
// En user.model.js
approved: {
  type: Boolean,
  default: false
}
```

## Estructura de Archivos

```
Frontend/src/
├── components/
│   ├── CompleteGoogleProfile.vue    # Modal para completar perfil
│   ├── ApprovalPending.vue          # Modal de espera de aprobación
│   └── ...
├── views/
│   ├── GoogleCallback.vue           # Vista principal del flujo
│   └── ...
├── services/
│   └── auth.service.js              # Servicio actualizado
└── router/
    └── index.js                     # Nueva ruta /google-callback
```

## Estados del Usuario

### 1. Perfil Incompleto
- Usuario autenticado con Google pero faltan campos requeridos
- Se muestra modal para completar información
- No puede acceder al sistema hasta completar

### 2. Pendiente de Aprobación
- Perfil completo pero usuario no es administrador
- Debe esperar que un admin apruebe su cuenta
- Se muestra mensaje informativo

### 3. Aprobado/Admin
- Usuario con acceso completo al sistema
- Redirigido automáticamente al dashboard
- Puede ver y gestionar proyectos

## Validaciones Implementadas

### Frontend
- DNI: 8 dígitos numéricos
- Rol: Selección obligatoria
- Campos requeridos marcados con *
- Validación antes de enviar al backend

### Backend
- Validación del modelo de usuario
- Verificación de sesión activa
- Manejo de errores apropiado

## Manejo de Errores

### Errores de Autenticación
- Usuario no autenticado → Redirigir a login
- Error en callback → Mostrar mensaje de error
- Perfil incompleto → Mostrar modal de completar

### Errores de Validación
- Campos requeridos faltantes
- Formato de DNI incorrecto
- Errores del backend

## Próximas Mejoras

- [ ] Notificaciones por email cuando se apruebe la cuenta
- [ ] Panel de administrador para aprobar usuarios
- [ ] Historial de aprobaciones
- [ ] Rechazo de cuentas con motivo
- [ ] Reenvío de solicitud de aprobación
- [ ] Integración con más proveedores OAuth

## Notas Importantes

1. **URLs**: Asegúrate de que las URLs del frontend y backend coincidan
2. **CORS**: El backend debe permitir requests desde el frontend
3. **Sesiones**: Las sesiones se manejan con cookies
4. **Variables de Entorno**: Configura las URLs apropiadamente
5. **Google OAuth**: Necesitas configurar las credenciales en el backend

## Testing

Para probar el flujo completo:

1. Inicia el backend en `http://localhost:8080`
2. Inicia el frontend en `http://localhost:3000`
3. Ve a `/login` y haz clic en "Continuar con Google"
4. Completa el flujo de OAuth
5. Verifica que se redirija a `/google-callback`
6. Completa el perfil si es necesario
7. Verifica el mensaje de espera de aprobación
