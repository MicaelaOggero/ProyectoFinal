# Empresas: primera etapa

Esta etapa agrega los modelos de empresa e invitación, el rol `superadmin` y los campos de empresa de usuarios y proyectos. Los módulos de permisos e invitaciones tienen pruebas aisladas.

Las rutas de empresas están conectadas y las rutas de proyectos, tareas, asignaciones, reportes y usuarios aplican controles de acceso por empresa. La migración local de Empresa Prueba se ejecutó. Las pruebas incluyen solicitudes HTTP y una prueba con dos empresas en una base temporal. Antes de publicar, verificar las variables del entorno de destino y probar nuevamente el flujo completo en ese entorno.

## Alta inicial del administrador general

El script `scripts/bootstrap-superadmin.js` es una herramienta local. Nunca se ejecuta al iniciar el servidor. Por defecto solo consulta la cuenta indicada:

```sh
node scripts/bootstrap-superadmin.js --email=CORREO
```

Si la cuenta no existe, `--create` permite diagnosticar el alta. Para aplicar la creación se requieren `--create --apply` y la variable temporal `BOOTSTRAP_PASSWORD`, con al menos ocho caracteres. Para promover una cuenta administradora existente se requiere `--apply`. La creación inicial se rechaza si ya hay un administrador general. No incluir contraseñas ni archivos `.env` en el repositorio.

## Invitaciones

El servicio utiliza `EMAIL_USER` y `EMAIL_PASSWORD` para Gmail, como en la rama de Mica. Las variables se configuran en `Backend/src/.env`; ese archivo está actualmente versionado, por lo que no debe incluirse al compartir cambios. También se admite Resend si se configuran sus variables. Si el correo no está configurado, el sistema devuelve un enlace para compartir manualmente. La invitación vence a las 48 horas y su token se guarda como hash.

## Pasos pendientes

1. Configurar Gmail en `.env` o en las variables del entorno de despliegue y comprobar el envío con autorización de la persona destinataria.
2. Publicar frontend y backend juntos y verificar que `FRONTEND_URL` apunte a la versión publicada.
3. La migración local ya se aplicó: `node scripts/migrar-empresa-prueba.js` muestra un diagnóstico; `--apply` requiere una transacción y registra las referencias anteriores. No ejecutar la migración de nuevo sin revisar los datos del entorno correspondiente.
