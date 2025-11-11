# Funcionalidades del Sistema de Gestión de Préstamos

## 🆕 ÚLTIMAS ACTUALIZACIONES (Noviembre 2025)

### 🔧 Edición de Clientes
- **Ubicación**: Botón azul "Editar" en cada tarjeta de cliente
- **Función**: Permite modificar toda la información del cliente:
  - Datos básicos (nombre, identidad, sobrenombre, teléfono)
  - Tasa de interés personalizada
  - Dirección de residencia y lugar de trabajo
  - Información de referencias personales
  - Datos financieros (salario, otros ingresos)
  - Notas adicionales
- **Ventajas**: Actualización en tiempo real visible para todos los usuarios

### 📋 Sistema de Gestión de Cobros por Quincena
- **Ubicación**: Botón "Cobro" o "Gestionar" en cada tarjeta de cliente
- **Función**: Control completo de gestión de cobros:
  - **Pagó** ✅ - Marca el cliente como cobrado esta quincena
  - **Próxima** ⏰ - Pospone el cobro para la siguiente quincena
  - **Pendiente** ⚠️ - Marca como pendiente de gestionar
- **Características**:
  - Registro del monto cobrado (opcional)
  - Notas de la gestión de cobro
  - Historial por fecha
  - Seguimiento automático

### 🚨 Alerta de Clientes Sin Gestionar
- **Ubicación**: Banner naranja en la parte superior (aparece automáticamente)
- **Función**: Muestra cuántos clientes faltan por gestionar hoy
- **Ventajas**:
  - Animación pulsante para llamar la atención
  - Click para acceder al primer cliente sin gestionar
  - Se actualiza automáticamente al marcar clientes
  - Evita olvidar clientes en la cobranza

### 🔄 Sincronización en Tiempo Real
- **Función**: Todos los cambios se sincronizan automáticamente
- **Aplicado a**:
  - Edición de clientes
  - Gestión de cobros
  - Creación de préstamos y pagos
- **Sin necesidad de refrescar la página**

---

## Nuevas Funcionalidades Agregadas

### 1. Estados de Cuenta en PDF
- **Ubicación**: Botón azul en el panel de cada cliente
- **Función**: Genera un PDF completo con:
  - Información del cliente
  - Resumen de todos los préstamos
  - Historial de pagos (capital e intereses)
  - Estadísticas generales
  - Tasa de recuperación
- **Uso**: Click en "Estado de Cuenta PDF" para descargar

### 2. Contratos de Préstamo en PDF
- **Ubicación**: Botón verde junto a cada préstamo
- **Función**: Genera un contrato formal con:
  - Datos del prestamista y prestatario
  - Condiciones del préstamo
  - Información de garantías (si aplica)
  - Cláusulas legales
  - Espacios para firmas
- **Uso**: Click en el botón "Contrato PDF" junto a cada préstamo

### 3. Análisis de Rentabilidad por Cliente
- **Ubicación**: Pestaña "Rentabilidad" en el menú principal
- **Función**: Muestra análisis detallado de cada cliente:
  - Margen de ganancia
  - ROI (Retorno de inversión)
  - Consistencia de pagos
  - Score de riesgo
  - Ranking de mejores y peores clientes
- **Filtros**: Por riesgo (bajo, medio, alto)
- **Ordenamiento**: Por margen, ROI o intereses pagados

### 4. Comparativas Mensuales y Anuales
- **Ubicación**: Pestaña "Comparativas" en el menú principal
- **Función**: Análisis temporal de operaciones:
  - Vista mensual y anual
  - Gráficos de barras interactivos
  - Préstamos creados por período
  - Capital e intereses cobrados
  - Nuevos clientes por mes/año
  - Crecimiento período a período
- **Exportación**: Datos disponibles en tabla

### 5. Negociación de Pagos y Planes Personalizados
- **Ubicación**: Icono de apretón de manos (morado) junto a cada préstamo
- **Función**: Crear planes de pago personalizados:
  - Plan personalizado
  - Interés reducido
  - Período de gracia
  - Reestructuración
- **Características**:
  - Configura número de cuotas
  - Frecuencia de pagos
  - Calendario automático
  - Seguimiento de pagos
- **Base de datos**: Tablas `payment_plans` y `plan_payments`

### 6. Modo Oscuro
- **Ubicación**: Botón con icono de luna/sol en el menú principal
- **Función**: Alterna entre modo claro y oscuro
- **Persistencia**: Se guarda la preferencia en localStorage
- **Aplicación**: Todo el sistema soporta ambos modos

### 7. Bitácora de Cambios por Usuario
- **Ubicación**: Pestaña "Actividad" en el menú principal
- **Función**: Registro completo de todas las acciones:
  - Creación, actualización y eliminación
  - Clientes, préstamos y pagos
  - Filtros por tipo, fecha y entidad
  - Búsqueda por nombre
  - Muestra cambios antes/después
- **Exportación**: Descarga en CSV

### 8. Recuperación de Contraseñas
- **Ubicación**: Link "¿Olvidaste tu contraseña?" en login
- **Función**: Sistema de recuperación por email:
  - Envía enlace de recuperación
  - Integrado con Supabase Auth
  - Confirmación visual
- **Proceso**: Email → Link → Nueva contraseña

### 9. Autenticación de Dos Factores (2FA)
- **Ubicación**: Pestaña "Seguridad" en el menú principal
- **Función**: Protección adicional con TOTP:
  - Código QR para escanear
  - Compatible con Google Authenticator y Authy
  - Código manual alternativo
  - Verificación de 6 dígitos
  - Activación/desactivación
- **Advertencia**: Guardar código secreto en lugar seguro

## Cómo Usar las Nuevas Funcionalidades

### Generar Estado de Cuenta:
1. Selecciona un cliente
2. Click en botón azul "Estado de Cuenta PDF"
3. El PDF se descarga automáticamente

### Crear Contrato de Préstamo:
1. Encuentra el préstamo deseado
2. Click en botón verde "Contrato PDF"
3. El contrato se descarga con toda la información

### Analizar Rentabilidad:
1. Click en pestaña "Rentabilidad"
2. Usa los filtros para segmentar
3. Ordena por margen, ROI o intereses
4. Revisa el score de riesgo de cada cliente

### Ver Comparativas:
1. Click en pestaña "Comparativas"
2. Selecciona vista mensual o anual
3. Elige el año (si es mensual)
4. Analiza gráficos y tablas
5. Observa crecimiento entre períodos

### Negociar Plan de Pago:
1. Junto a un préstamo, click en icono morado (apretón de manos)
2. Selecciona tipo de plan
3. Configure monto, cuotas y frecuencia
4. Revisa el calendario generado
5. Guarda el plan
6. Sistema crea registros en base de datos

### Activar Modo Oscuro:
1. Click en icono de luna/sol en menú principal
2. El tema cambia instantáneamente
3. Preferencia se guarda automáticamente

### Ver Registro de Actividad:
1. Click en pestaña "Actividad"
2. Filtra por tipo de acción o entidad
3. Busca por nombre o fecha
4. Exporta a CSV si necesitas

### Recuperar Contraseña:
1. En login, click "¿Olvidaste tu contraseña?"
2. Ingresa tu email
3. Revisa tu bandeja de entrada
4. Sigue el enlace recibido
5. Establece nueva contraseña

### Configurar 2FA:
1. Click en pestaña "Seguridad"
2. Click "Activar Autenticación de Dos Factores"
3. Escanea código QR con tu app (Google Authenticator)
4. O ingresa código manualmente
5. Introduce código de 6 dígitos para verificar
6. 2FA activado

## Base de Datos

### Nuevas Tablas:
- `payment_plans`: Planes de pago negociados
- `plan_payments`: Pagos programados de planes

### Tablas Existentes:
- `loans`: Información de préstamos
- `payments`: Pagos de capital
- `clients`: Datos de clientes
- `audit_logs`: Registro de cambios
- `notification_dismissals`: Notificaciones descartadas

## Tecnologías Utilizadas

- **React 18** + TypeScript
- **Tailwind CSS** con soporte dark mode
- **Supabase**: Base de datos, Auth, Storage
- **jsPDF + jspdf-autotable**: Generación de PDFs
- **Chart.js**: Gráficos interactivos
- **Lucide React**: Iconos

## Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Políticas restrictivas por defecto
- ✅ Autenticación requerida
- ✅ 2FA disponible
- ✅ Recuperación segura de contraseñas
- ✅ Audit log de cambios
- ✅ Variables de entorno

## Notas Importantes

1. **Dashboard Financiero**: Ahora carga correctamente con todos los gráficos
2. **Modo Oscuro**: Aplicado a toda la aplicación
3. **PDFs**: Se generan en el cliente, no requieren servidor
4. **Planes de Pago**: Almacenados en base de datos para seguimiento
5. **2FA**: Usar app compatible (Google Authenticator, Authy, etc.)
6. **Build**: Proyecto compilado exitosamente

## Próximos Pasos Sugeridos

- Implementar notificaciones push
- Agregar exportación de planes de pago
- Dashboard de planes de pago activos
- Reportes de morosidad mejorados
- Integración con WhatsApp Business API
