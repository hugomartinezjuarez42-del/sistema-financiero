# Prueba de Acceso a Datos - Script de Diagnóstico

## ✅ VERIFICADO EN BASE DE DATOS

He verificado directamente en la base de datos y la configuración es CORRECTA:

```
Usuario: ayonismejia@gmail.com       → Org: 54df46e7... → 11 clientes ✅
Usuario: ildelizag@gmail.com         → Org: 54df46e7... → 11 clientes ✅
Usuario: marianvalle186@gmail.com    → Org: 54df46e7... → 11 clientes ✅
```

**Todos los usuarios están en la MISMA organización y deberían ver los MISMOS 11 clientes.**

---

## 🔍 PRUEBA PASO A PASO

### Paso 1: Cierra Todas las Sesiones

**En TODOS los dispositivos:**
1. Cierra la aplicación completamente
2. Limpia caché del navegador:
   - Chrome: Ctrl+Shift+Delete → Marcar "Imágenes y archivos en caché" → Borrar datos
   - Firefox: Ctrl+Shift+Delete → Marcar "Caché" → Limpiar ahora
3. Cierra el navegador completamente
4. Abre el navegador de nuevo

### Paso 2: Entra con Cada Usuario

**Usuario 1: ayonismejia@gmail.com**
1. Abre el sitio web
2. Ingresa: ayonismejia@gmail.com + contraseña
3. Espera a que cargue
4. **Cuenta cuántos clientes ves**
5. **Toma captura de pantalla**

**Usuario 2: ildelizag@gmail.com**
1. Abre el sitio web (en otro navegador o modo incógnito)
2. Ingresa: ildelizag@gmail.com + contraseña
3. Espera a que cargue
4. **Cuenta cuántos clientes ves**
5. **Toma captura de pantalla**

**Usuario 3: marianvalle186@gmail.com**
1. Abre el sitio web (en otro navegador o modo incógnito)
2. Ingresa: marianvalle186@gmail.com + contraseña
3. Espera a que cargue
4. **Cuenta cuántos clientes ves**
5. **Toma captura de pantalla**

### Paso 3: Script de Diagnóstico

**En cada usuario, abre la Consola del Navegador:**
- Chrome/Edge: F12 → pestaña "Console"
- Firefox: F12 → pestaña "Consola"

**Copia y pega este código:**

```javascript
// SCRIPT DE DIAGNÓSTICO
(async function() {
  console.log('=== DIAGNÓSTICO DE ACCESO ===');

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  console.log('1. Usuario autenticado:', user?.email, user?.id);

  // Verificar organización
  const { data: orgData } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user?.id)
    .maybeSingle();
  console.log('2. Organización:', orgData);

  // Contar clientes
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, organization_id')
    .eq('organization_id', orgData?.organization_id);

  console.log('3. Clientes encontrados:', clients?.length);
  console.log('4. Error (si hay):', error);
  console.log('5. Primeros 5 clientes:', clients?.slice(0, 5).map(c => c.name));

  // Verificar RLS
  const { data: allClients } = await supabase
    .from('clients')
    .select('id, name');
  console.log('6. Clientes sin filtro (deberían ser los mismos):', allClients?.length);

  console.log('=== FIN DIAGNÓSTICO ===');
  console.log('RESULTADO ESPERADO:');
  console.log('- Organización: 54df46e7-7ff9-4e80-9593-3a32ca3690a5');
  console.log('- Clientes: 11');
  console.log('');
  console.log('Si ves números diferentes, COPIA este output completo.');
})();
```

**Presiona Enter y copia TODO el output que aparezca.**

---

## 📊 RESULTADO ESPERADO

Para TODOS los usuarios debería aparecer:

```
=== DIAGNÓSTICO DE ACCESO ===
1. Usuario autenticado: [email] [uuid]
2. Organización: {
     organization_id: "54df46e7-7ff9-4e80-9593-3a32ca3690a5",
     role: "admin"
   }
3. Clientes encontrados: 11
4. Error (si hay): null
5. Primeros 5 clientes: ["9", "Adon", "Ayonis", "Ilde", "Jgjgjcyvfuvc"]
6. Clientes sin filtro (deberían ser los mismos): 11
=== FIN DIAGNÓSTICO ===
```

---

## 🐛 SI NO FUNCIONA

### Problema 1: organization_id es null
```javascript
2. Organización: null
```

**Solución:**
1. El usuario no está en la organización
2. Ejecuta este código en la consola:
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Mi user_id:', user.id);
// Envía este ID al administrador
```

### Problema 2: Clientes encontrados: 0
```javascript
3. Clientes encontrados: 0
```

**Posibles causas:**
- organization_id no coincide
- RLS bloqueando acceso
- Sesión corrupta

**Solución:**
1. Cierra sesión
2. Borra caché completamente
3. Vuelve a entrar

### Problema 3: Error de autenticación
```javascript
1. Usuario autenticado: undefined
```

**Solución:**
- No estás autenticado correctamente
- Recarga la página (Ctrl+Shift+R)
- Vuelve a hacer login

---

## 🔄 FORZAR RECARGA DE DATOS

Si estás dentro de la aplicación y no ves los datos, ejecuta esto en la consola:

```javascript
// FORZAR RECARGA
location.reload(true); // Recarga forzada
```

O presiona: **Ctrl + Shift + R** (Windows/Linux) o **Cmd + Shift + R** (Mac)

---

## 📱 PRUEBA MULTI-DISPOSITIVO

**Escenario de Prueba:**
1. Usuario A entra desde su celular
2. Usuario A entra desde su computadora
3. Usuario B entra desde su celular

**Todos deberían ver los mismos 11 clientes:**
- 9
- Adon
- Ayonis
- Ilde
- Jgjgjcyvfuvc
- Jgyy
- Jj
- Jose valle
- M
- Marian
- Zo

---

## ⚠️ IMPORTANTE

Si después de hacer TODAS estas pruebas:
1. Limpiar caché
2. Cerrar sesión y volver a entrar
3. Probar el script de diagnóstico

Y AÚN no ves los 11 clientes, entonces:

**Copia TODA la salida del script de diagnóstico y envíala.**

Necesito ver exactamente qué está retornando para cada usuario.

---

## 📝 FORMULARIO DE REPORTE

Si no funciona, llena esto:

```
USUARIO: [tu email]
DISPOSITIVO: [Celular/Computadora - Marca/Modelo]
NAVEGADOR: [Chrome/Firefox/Safari - Versión]

RESULTADO DEL SCRIPT:
[Pegar aquí TODO el output de la consola]

CAPTURA DE PANTALLA:
[Adjuntar captura mostrando cuántos clientes ves]

¿LIMPIASTE CACHÉ?: [Sí/No]
¿CERRASTE Y REABRISTE NAVEGADOR?: [Sí/No]
¿PROBASTE EN MODO INCÓGNITO?: [Sí/No]
```

---

## ✅ VERIFICACIÓN FINAL

Después de la build más reciente, ejecuta:

```bash
npm run build
```

Y asegúrate de que estás accediendo a la versión más nueva de la aplicación (no una versión en caché).

Si estás en producción, puede que el navegador esté mostrando una versión vieja. Solución:
1. Ctrl + Shift + Delete
2. Borrar caché de los últimos 7 días
3. Refrescar con Ctrl + Shift + R
