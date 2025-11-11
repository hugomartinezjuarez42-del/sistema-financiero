# Sistema de Gestión de Préstamos - Inversiones GVM

## Información del Sistema

Este es un sistema completo de gestión de préstamos desarrollado con React, TypeScript, Vite y Supabase.

## Características Principales

- **Gestión de Clientes**: Registro completo con cédula, teléfono, dirección
- **Préstamos**: Control de capital, intereses quincenales, pagos
- **Documentos**: Subida de cédulas, contratos, pagarés (Storage)
- **Recordatorios WhatsApp**: Mensajes automáticos con estado de cuenta
- **Recibos**: Generación e impresión de comprobantes
- **Análisis de Crédito**: Score crediticio automático
- **Reportes**: Exportación a PDF y CSV
- **Backup/Restore**: Respaldo de datos

## Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Gráficos**: Chart.js

## Estructura de la Base de Datos

### Tablas Principales:
- `loans` - Préstamos principales
- `loan_payments` - Pagos de capital
- `interest_payments` - Pagos de interés quincenal
- `clients` - Información de clientes
- `client_documents` - Registro de documentos
- `whatsapp_reminders` - Recordatorios programados
- `client_notes` - Notas y comentarios
- `audit_log` - Registro de auditoría

### Storage Buckets:
- `receipts` - Recibos generados
- `client-documents` - Documentos de clientes

## Solución de Problemas Comunes

### 1. Los cambios no se ven en el navegador
**Solución:**
- Presiona `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
- O abre DevTools (F12) y haz clic derecho en recargar → "Vaciar caché y recargar"

### 2. No se pueden subir documentos
**Problema:** Faltan permisos en el bucket de storage
**Solución:**
```sql
-- Verificar que el bucket existe y es público
SELECT id, name, public FROM storage.buckets WHERE id = 'client-documents';

-- Verificar políticas
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### 3. Los recordatorios de WhatsApp no generan mensajes
**Problema:** Cliente sin préstamos activos o datos incompletos
**Solución:**
- Asegúrate de que el cliente tenga al menos un préstamo activo
- Verifica que el préstamo tenga fecha, capital y tasa de interés
- Recarga la página completamente

### 4. Error al iniciar sesión
**Problema:** Credenciales incorrectas o usuario no registrado
**Solución:**
- Verifica las variables de entorno en `.env`
- Asegúrate de que el usuario esté registrado en Supabase Auth
- Revisa la consola del navegador para ver errores específicos

## Variables de Entorno Requeridas

Archivo `.env`:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Publicación en Producción

### Opción 1: Netlify (Recomendado)
1. Crea cuenta en [Netlify](https://netlify.com)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno en Netlify
4. Build command: `npm run build`
5. Publish directory: `dist`

### Opción 2: Vercel
1. Crea cuenta en [Vercel](https://vercel.com)
2. Importa tu proyecto
3. Agrega las variables de entorno
4. Vercel detectará automáticamente Vite

### Opción 3: GitHub Pages + GitHub Actions
1. Agrega las variables de entorno como Secrets en GitHub
2. Configura GitHub Actions para build automático
3. Publica en GitHub Pages

## Configuración de Supabase para Producción

1. **Políticas RLS**: Ya están configuradas para producción
2. **Autenticación**: Configura el dominio de tu aplicación en Supabase
3. **Storage**: Los buckets están configurados como públicos
4. **Database**: Usa connection pooling para mejor rendimiento

## Mantenimiento y Soporte

### Backup Regular
- Usa la función de Backup/Restore en el sistema
- Configura backups automáticos en Supabase (Plan Pro)
- Exporta datos importantes a CSV regularmente

### Monitoreo
- Revisa los logs de Supabase regularmente
- Monitorea el uso de storage (límite según plan)
- Revisa el audit_log para cambios importantes

### Actualizaciones
```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Rebuild
npm run build
```

## Contacto y Soporte Técnico

### Para problemas técnicos:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de Supabase
3. Verifica las políticas de seguridad (RLS)

### Recursos Útiles:
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Vite](https://vitejs.dev)
- [Guía de Tailwind CSS](https://tailwindcss.com/docs)

## Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Autenticación requerida para todas las operaciones
- ✅ Variables de entorno para credenciales
- ✅ HTTPS obligatorio en producción
- ✅ Audit log de todas las operaciones críticas

## Licencia

Sistema desarrollado para Inversiones GVM.
Todos los derechos reservados.

---

**Versión:** 1.0.0
**Última actualización:** Noviembre 2024
