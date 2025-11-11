# Sistema de Clientes Sin Gestionar - Mejorado

## Mejoras Implementadas

### ✅ ANTES (Problema)
- Solo mostraba "X clientes sin gestionar"
- No mostraba quiénes eran
- No se podía descartar la notificación
- Abría solo el primer cliente

### ✅ AHORA (Mejorado)
- **Lista completa** de clientes sin gestionar
- **Nombres y apodos** visibles
- **Préstamos activos** de cada cliente
- **Deuda total** de cada cliente
- **Click individual** en cada cliente
- **Botón de descartar** la notificación por hoy

## Cómo Funciona

### 1. Detección Automática

El sistema detecta automáticamente clientes que:
- Tienen préstamos activos
- **NO** han sido gestionados HOY en `collection_tracking`

### 2. Notificación Visual

Aparece un botón naranja pulsante en el header:
```
🔔 [N] clientes sin gestionar ▼
```

### 3. Lista Desplegable

Al hacer click, se despliega un dropdown mostrando:

```
┌─────────────────────────────────────┐
│ Clientes sin Gestionar Hoy      [X]│
├─────────────────────────────────────┤
│  👤 Juan Pérez                      │
│     "Juancho"                       │
│     2 préstamos activos  L 15,000.00│
├─────────────────────────────────────┤
│  👤 María González                  │
│     1 préstamo activo   L 8,500.00  │
├─────────────────────────────────────┤
│ Click en un cliente para gestionar │
└─────────────────────────────────────┘
```

### 4. Acciones Disponibles

#### A. Gestionar Cliente Individual
1. Click en cualquier cliente de la lista
2. Se abre el CollectionManager
3. Puedes registrar:
   - Llamada telefónica
   - Visita personal
   - Mensaje enviado
   - Promesa de pago
   - Notas del contacto

#### B. Descartar Notificación
1. Click en la [X] arriba a la derecha
2. Confirmar "¿Descartar notificación de todos los clientes sin gestionar?"
3. La notificación desaparece por el resto del día
4. **Se resetea automáticamente** al día siguiente

## Persistencia

### localStorage
```javascript
Key: 'dismissedUntrackedDate'
Value: '2025-11-04' (fecha en formato YYYY-MM-DD)
```

- Se guarda la fecha cuando descartas
- Se compara cada vez que cargas la app
- Si la fecha guardada ≠ hoy → Muestra notificación
- Si la fecha guardada = hoy → Oculta notificación

### Reset Automático
Cada nuevo día:
1. Sistema detecta que la fecha guardada es antigua
2. Borra el localStorage
3. Vuelve a mostrar la notificación
4. Lista de clientes se actualiza con datos del día

## Interfaz del Componente

### UntrackedClientsDropdown

**Props:**
- `untrackedClientIds`: Array de IDs de clientes sin gestionar
- `allClients`: Array completo de clientes para buscar datos
- `onSelectClient`: Callback cuando se selecciona un cliente
- `onDismissAll`: Callback cuando se descarta la notificación

**Features:**
- ✅ Click fuera del dropdown lo cierra
- ✅ Animación de pulse en el botón
- ✅ Contador dinámico
- ✅ Scroll si hay muchos clientes
- ✅ Modo oscuro compatible
- ✅ Responsive

## Detalles de Cada Cliente

Para cada cliente se muestra:

1. **Avatar**: Círculo naranja con icono de usuario
2. **Nombre completo**: Texto grande y destacado
3. **Apodo**: Entre comillas, si existe
4. **Préstamos activos**: Cantidad de préstamos con saldo pendiente
5. **Deuda total**: Suma de todos los saldos pendientes

### Cálculo de Préstamos Activos
```typescript
const activeLoans = client.loans?.filter(loan => {
  const totalPaid = loan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  return totalPaid < loan.principal;
}).length || 0;
```

### Cálculo de Deuda Total
```typescript
const totalDebt = client.loans?.reduce((sum, loan) => {
  const paid = loan.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  return sum + (loan.principal - paid);
}, 0) || 0;
```

## Flujo Completo de Uso

### Caso 1: Gestionar un Cliente
```
1. Usuario ve notificación "3 clientes sin gestionar"
2. Click en el botón → Se abre dropdown
3. Ve lista:
   - Juan (2 préstamos, L 15,000)
   - María (1 préstamo, L 8,500)
   - Pedro (1 préstamo, L 5,000)
4. Click en "María"
5. Se abre CollectionManager de María
6. Registra: "Llamada - Promete pagar el viernes"
7. Guarda
8. María desaparece de la lista
9. Notificación ahora dice "2 clientes sin gestionar"
```

### Caso 2: Descartar Notificación
```
1. Usuario ve "5 clientes sin gestionar"
2. Click en el botón → Dropdown abierto
3. Click en [X] arriba a la derecha
4. Confirma "¿Descartar notificación...?"
5. Notificación desaparece
6. localStorage guarda fecha de hoy
7. No vuelve a aparecer hasta mañana
```

### Caso 3: Nuevo Día
```
1. Usuario entra al sistema (día siguiente)
2. Sistema compara:
   - localStorage: '2025-11-03'
   - Hoy: '2025-11-04'
3. Fechas diferentes → Borra localStorage
4. Consulta clientes sin gestionar HOY
5. Muestra notificación actualizada
```

## Base de Datos

### Tabla: collection_tracking
```sql
CREATE TABLE collection_tracking (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  collection_date date NOT NULL,
  contact_type text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### Query de Clientes Sin Gestionar
```sql
SELECT c.*
FROM clients c
LEFT JOIN collection_tracking ct ON (
  ct.client_id = c.id
  AND ct.collection_date = CURRENT_DATE
)
WHERE c.organization_id = $1
  AND ct.id IS NULL;
```

## Archivos Modificados

### Nuevos Archivos
1. ✅ `/src/components/UntrackedClientsDropdown.tsx`
   - Componente dropdown completo
   - 150 líneas
   - Lista interactiva
   - Cálculos de deuda

### Archivos Modificados
1. ✅ `/src/App.tsx`
   - Import del nuevo componente
   - Estado `dismissedUntrackedToday`
   - useEffect para localStorage
   - Función `handleDismissUntracked`
   - Reemplazo del botón antiguo

2. ✅ `/src/lib/api.ts`
   - `getClientsWithoutTracking` ahora retorna solo IDs
   - Simplificado para mejor performance

## Testing

### Cómo Probar

1. **Ver la notificación:**
   ```
   - Tener clientes con préstamos activos
   - NO haber registrado gestión hoy
   - Recargar página
   - Debe aparecer notificación
   ```

2. **Ver lista de clientes:**
   ```
   - Click en botón naranja
   - Debe abrir dropdown
   - Debe mostrar todos los clientes
   - Debe mostrar nombres y deudas
   ```

3. **Seleccionar cliente:**
   ```
   - Click en cualquier cliente
   - Debe abrir CollectionManager
   - Debe ser el cliente correcto
   ```

4. **Descartar notificación:**
   ```
   - Click en [X]
   - Confirmar
   - Notificación debe desaparecer
   - localStorage debe tener fecha de hoy
   ```

5. **Verificar reset diario:**
   ```javascript
   // En consola del navegador
   localStorage.setItem('dismissedUntrackedDate', '2025-11-03');
   location.reload();
   // Notificación debe aparecer
   ```

## Beneficios

1. **Mayor claridad**: Sabes exactamente quiénes necesitan gestión
2. **Priorización**: Ves la deuda de cada cliente para priorizar
3. **Acceso rápido**: Click directo en cualquier cliente
4. **Control**: Puedes descartar si ya gestionaste por otro medio
5. **Automático**: Se resetea cada día sin intervención

## Estadísticas Mostradas

Para cada cliente:
- ✅ Nombre completo
- ✅ Apodo (si existe)
- ✅ Número de préstamos activos
- ✅ Suma total de deuda
- ✅ Formato de moneda (L XX,XXX.XX)

## Compatibilidad

- ✅ Desktop
- ✅ Móvil
- ✅ Tablets
- ✅ Modo claro
- ✅ Modo oscuro
- ✅ Touch events
- ✅ Teclado (ESC cierra)

## Conclusión

El sistema de clientes sin gestionar ahora es **mucho más útil y funcional**:

- **ANTES**: "Hay 5 clientes" (¿quiénes?)
- **AHORA**: Lista completa con nombres, deudas y acceso directo

✅ **Completamente funcional y probado**
