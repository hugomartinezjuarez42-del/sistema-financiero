# 🧪 PRUEBA: Vistas Previas de PDFs y Documentos

## ✅ CORRECCIONES APLICADAS

Se han corregido los problemas de visualización de PDFs y documentos.

---

## 🔧 CAMBIOS REALIZADOS

### 1. PaymentPlanPDF - Vista Previa de Planes ✅

**Problema anterior:**
- La vista previa mostraba ícono vacío
- Blob URLs no funcionaban bien en móviles
- iframe no cargaba contenido

**Solución aplicada:**
- Cambio de `blob` URL a `data:application/pdf;base64` (Data URI)
- Mejor compatibilidad con navegadores móviles
- Manejo de errores mejorado

**Código:**
```typescript
// Antes (no funcionaba en móvil):
const pdfBlob = doc.output('blob');
const url = URL.createObjectURL(pdfBlob);

// Ahora (funciona en móvil):
const pdfDataUri = doc.output('datauristring');
// pdfDataUri = "data:application/pdf;base64,JVBERi0xLjM..."
```

### 2. DocumentManager - Vista Previa de Documentos ✅

**Problema anterior:**
- Documentos no se mostraban
- URLs públicas podían tener problemas de permisos

**Solución aplicada:**
- Uso de URLs firmadas (signed URLs) con expiración de 1 hora
- Fallback a URLs públicas si falla
- Mejor manejo de errores
- Parámetro `#view=FitH` para mejor visualización de PDFs

**Mejoras adicionales:**
- `onError` handlers para detectar problemas de carga
- Mensajes de error claros
- Mejor diseño del modal de vista previa

---

## 📋 GUÍA DE PRUEBA

### Preparación Obligatoria

**PASO 1: BORRAR CACHÉ** (CRÍTICO)
1. Samsung Internet/Chrome: Configuración → Privacidad → Borrar caché
2. Cierra la app completamente (Recientes → desliza arriba)
3. Espera 5 segundos
4. Abre la app de nuevo
5. Espera 20 segundos a que cargue completamente

---

## PRUEBA 1: Vista Previa de Plan de Negociación

### Crear un Plan de Prueba

1. **Selecciona un cliente con préstamo activo**

2. **Abre negociación**
   - En lista de préstamos, click en 🤝 (Negociar)

3. **Llena el formulario con datos de prueba:**
   - Tipo de Plan: Custom
   - Monto Negociado: 5000
   - Tasa de Interés: 2%
   - Número de Cuotas: 2
   - Frecuencia: 15 días
   - Fecha de Inicio: hoy

4. **Click "Crear Plan de Pago"**
   - Espera mensaje de éxito
   - Modal se cierra

### Ver el Plan Creado

5. **Abre planes del cliente**
   - Click en botón morado "Planes"
   - Debe aparecer el plan recién creado

6. **Vista Previa del PDF**
   - Click en botón **"Ver"** (👁️ ojo azul)
   - **Espera 2-3 segundos** (generación del PDF)

### Verificar Vista Previa

✅ **Debe aparecer:**
- Modal con título "Vista Previa - Plan de Negociación"
- PDF visible en el iframe (NO ícono de documento vacío)
- Contenido del PDF legible
- Tabla con columnas: #, Fecha, Capital, Interés, Total
- Datos del cliente visibles
- Botones: Descargar, Imprimir, Cerrar

❌ **NO debe aparecer:**
- Ícono de documento vacío
- Pantalla blanca
- Error "No se pudo cargar"

### Probar Funciones

7. **Descargar PDF**
   - Click en botón verde "Descargar"
   - Archivo se descarga
   - Abre el archivo descargado
   - ✅ Verifica que contiene todo el contenido

8. **Imprimir PDF**
   - Click en botón morado "Imprimir"
   - Se abre nueva ventana/pestaña
   - PDF visible en ventana de impresión
   - ✅ Vista previa de impresión correcta

9. **Cerrar**
   - Click en "Cerrar"
   - Modal se cierra correctamente

---

## PRUEBA 2: Vista Previa de Documentos Subidos

### Subir Documento de Prueba

1. **Selecciona un cliente**

2. **Abre Documentos**
   - En menú superior, hay un ícono de documentos
   - O busca opción "Documentos" del cliente

3. **Subir documento**
   - Click "Subir Documento"
   - Tipo: "INE/Identificación"
   - Selecciona una **IMAGEN** (JPG/PNG) primero
   - Click "Subir"
   - Espera confirmación

### Ver Documento de Imagen

4. **Vista previa de imagen**
   - En la lista de documentos, busca el que subiste
   - Click en ícono de **ojo** (👁️ Ver)

✅ **Debe mostrar:**
- Modal "Vista Previa del Documento"
- Imagen visible y centrada
- Imagen con buen tamaño (no muy pequeña ni muy grande)
- Botón "Cerrar" abajo

❌ **NO debe:**
- Pantalla blanca
- Ícono de imagen rota
- Error

### Subir PDF de Prueba

5. **Subir un PDF**
   - Click "Subir Documento"
   - Tipo: "Pagaré"
   - Selecciona un archivo **PDF**
   - Click "Subir"
   - Espera confirmación

### Ver Documento PDF

6. **Vista previa de PDF**
   - Click en ícono de ojo (👁️ Ver) del PDF
   - **Espera 2-3 segundos**

✅ **Debe mostrar:**
- Modal con título "Vista Previa del Documento"
- PDF visible en iframe
- Contenido del PDF legible
- Scroll si el PDF tiene varias páginas
- Botón "Cerrar"

❌ **NO debe:**
- Ícono de documento vacío
- Pantalla gris vacía
- Error "No se pudo cargar"

### Probar Descarga

7. **Descargar documento**
   - Click en ícono de descarga (💾)
   - Archivo se descarga
   - ✅ Abre el archivo descargado
   - ✅ Verifica que es el correcto

### Probar Impresión

8. **Imprimir documento**
   - Click en ícono de impresora (🖨️)
   - Se abre diálogo de impresión del navegador
   - ✅ Vista previa muestra el documento

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Si la Vista Previa NO Funciona

**Síntoma 1: Ícono de documento vacío**

**Causa probable:** Caché viejo
**Solución:**
1. Borra caché COMPLETAMENTE
2. Cierra app
3. Limpia datos de la app (Configuración → Apps → [App] → Almacenamiento → Borrar datos)
4. Vuelve a abrir
5. Login de nuevo

**Síntoma 2: Pantalla blanca o gris**

**Causa probable:** Problema de permisos o URL
**Diagnóstico:**
1. Abre consola del navegador (F12 en desktop)
2. Ve a pestaña "Console"
3. Intenta abrir vista previa
4. Busca errores en rojo

**Errores comunes:**
- `Failed to load PDF`: Problema con la URL del archivo
- `CORS error`: Problema de permisos de storage
- `404 Not Found`: Archivo no existe en storage

**Solución:**
- Para planes: El PDF se genera localmente, no debería fallar
- Para documentos: Verifica que el archivo se subió correctamente

**Síntoma 3: Error "No se pudo cargar"**

**Causa:** Archivo corrupto o formato no soportado
**Solución:**
1. Descarga el archivo directamente
2. Intenta abrirlo en tu dispositivo
3. Si no abre, el archivo está corrupto
4. Sube el documento de nuevo

### Si la Descarga NO Funciona

**Causa:** Bloqueador de descargas
**Solución:**
1. Ve a configuración del navegador
2. Busca "Descargas"
3. Permite descargas automáticas para el sitio
4. Intenta de nuevo

### Si la Impresión NO Funciona

**Causa:** Bloqueador de pop-ups
**Solución:**
1. Permite pop-ups para el sitio
2. Intenta de nuevo
3. Alternativamente: Descarga → Abre → Imprime manualmente

---

## 🧪 PRUEBAS ADICIONALES

### Prueba con Diferentes Tipos de Archivos

1. **Imagen JPG** (pequeña, < 1 MB)
   - ✅ Debe verse completa
   - ✅ Buena calidad

2. **Imagen PNG** (mediana, 2-3 MB)
   - ✅ Debe cargar (puede tardar 1-2 segundos)
   - ✅ Vista correcta

3. **PDF Simple** (1 página)
   - ✅ Carga rápido
   - ✅ Vista completa

4. **PDF Múltiple** (varias páginas)
   - ✅ Puede hacer scroll
   - ✅ Todas las páginas visibles

### Prueba en Diferentes Navegadores

Si tienes acceso, prueba en:
- ✅ Chrome móvil
- ✅ Samsung Internet
- ✅ Firefox móvil
- ✅ Safari (iOS)

**Resultado esperado:** Funciona en todos

---

## 📊 VERIFICACIÓN TÉCNICA

### En Base de Datos

```sql
-- Verificar que documentos tienen file_path correcto
SELECT
  id,
  client_id,
  document_type,
  file_name,
  file_path,
  file_size,
  uploaded_at
FROM client_documents
ORDER BY uploaded_at DESC
LIMIT 5;
```

**Verificar:**
- `file_path` NO debe ser NULL
- `file_path` debe tener formato: `[client-id]/[filename]`
- `file_size` debe ser > 0

### En Storage

```sql
-- Verificar archivos en storage
SELECT
  name,
  bucket_id,
  metadata->>'size' as size,
  created_at
FROM storage.objects
WHERE bucket_id = 'client-documents'
ORDER BY created_at DESC
LIMIT 5;
```

**Verificar:**
- Archivos existen en storage
- `name` coincide con `file_path` de la tabla
- `size` es correcto

---

## ✅ CHECKLIST FINAL

### Vista Previa de Planes
- [ ] Botón "Ver" existe y es visible
- [ ] Click en "Ver" abre modal
- [ ] PDF se genera (espera 2-3 segundos)
- [ ] PDF es visible en modal (NO ícono vacío)
- [ ] Contenido del PDF es correcto
- [ ] Tabla con capital e interés visible
- [ ] Botón "Descargar" funciona
- [ ] Botón "Imprimir" funciona
- [ ] Botón "Cerrar" cierra modal

### Vista Previa de Documentos
- [ ] Subir documento funciona
- [ ] Documento aparece en lista
- [ ] Botón "Ver" (ojo) existe
- [ ] Click abre modal de vista previa
- [ ] Imagen se muestra correctamente
- [ ] PDF se muestra correctamente
- [ ] Botón "Cerrar" funciona
- [ ] Descarga funciona
- [ ] Impresión funciona

### Compatibilidad
- [ ] Funciona en modo claro
- [ ] Funciona en modo oscuro
- [ ] Funciona en móvil
- [ ] Funciona en tablet
- [ ] Funciona en desktop

---

## 🎯 RESULTADO ESPERADO

Al completar TODAS las pruebas:

✅ **Planes de Negociación:**
- Vista previa del PDF funciona perfectamente
- Se ve el contenido completo con tabla
- Descarga funciona
- Impresión funciona

✅ **Documentos:**
- Imágenes se ven en vista previa
- PDFs se ven en vista previa
- Descarga funciona
- Impresión funciona

✅ **Sin errores:**
- No aparecen íconos de documento vacío
- No hay pantallas blancas
- No hay errores en consola

---

## 📞 REPORTAR RESULTADOS

Si encuentras problemas, reporta:

**Información necesaria:**
1. Screenshot del problema
2. Navegador y versión
3. ¿Borraste caché?
4. ¿Qué estabas intentando hacer?
5. Error de consola (F12) si hay

**Para Planes:**
- ¿El modal se abre?
- ¿Qué ves en el modal? (screenshot)
- ¿Hay algún mensaje de error?

**Para Documentos:**
- ¿El archivo se subió correctamente?
- ¿Qué tipo de archivo es? (JPG/PNG/PDF)
- ¿Qué tamaño tiene?
- ¿Qué ves al hacer click en "Ver"?

---

**Fecha:** 2025-11-04
**Versión:** Corregida con Data URI
**Estado:** LISTO PARA PRUEBAS ✅
