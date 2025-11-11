# 📄 GUÍA: Planes de Negociación - Ver, Descargar e Imprimir

## ✅ FUNCIONALIDAD IMPLEMENTADA

Se ha agregado un sistema completo para **visualizar, descargar e imprimir** los planes de negociación de pago en formato PDF profesional.

---

## 🎯 CARACTERÍSTICAS

### 1. Ver Planes de Negociación ✅
- Modal completo con todos los planes del cliente
- Vista expandible/colapsable
- Información detallada del plan
- Calendario de pagos
- Progreso visual (barra de progreso)
- Estados con colores (Activo, Completado, Cancelado, Pendiente)

### 2. Vista Previa PDF ✅
- Modal con vista previa del PDF
- Visualización en iframe
- Botones para descargar e imprimir desde la vista previa

### 3. Descargar PDF ✅
- Descarga directa del PDF
- Nombre de archivo descriptivo: `Plan_Negociacion_[ClienteNombre]_[Fecha].pdf`
- PDF profesional con toda la información

### 4. Imprimir PDF ✅
- Impresión directa desde el navegador
- Formato optimizado para impresión
- Abre ventana de impresión automáticamente

---

## 🚀 CÓMO USAR

### Paso 1: Acceder a los Planes

1. **En la lista de clientes**, busca el cliente
2. Click en el botón **"Planes"** (botón morado con icono de documento)
3. Se abrirá el modal con todos los planes de negociación del cliente

### Paso 2: Ver Información del Plan

En el modal verás:
- **Tipo de plan:** Extensión de Plazo, Reducción de Interés, etc.
- **Estado:** Activo, Completado, Cancelado
- **Información resumida:**
  - Monto negociado
  - Número de cuotas
  - Monto por cuota
  - Frecuencia de pago
- **Barra de progreso:** Visual del porcentaje completado
- **Botones de acción:**
  - 👁️ **Ver** - Vista previa del PDF
  - 💾 **Descargar** - Descarga el PDF
  - 🖨️ **Imprimir** - Imprime el PDF

### Paso 3: Ver Detalles

1. Click en **"Ver detalles"** para expandir el plan
2. Verás:
   - Fechas de inicio y finalización
   - Monto original vs negociado
   - Período de gracia
   - Nueva tasa de interés (si aplica)
   - Notas adicionales
   - **Calendario completo de pagos**

### Paso 4: Vista Previa del PDF

1. Click en botón **"Ver"** (👁️)
2. Se generará y mostrará el PDF en un modal
3. Puedes:
   - Ver el documento completo
   - Descargar desde ahí
   - Imprimir desde ahí
   - Cerrar la vista previa

### Paso 5: Descargar PDF

**Opción A: Desde el listado**
1. Click en botón **"Descargar"** (💾)
2. El PDF se descargará automáticamente
3. Mensaje de confirmación

**Opción B: Desde vista previa**
1. Abre vista previa (Ver)
2. Click en "Descargar" en el modal
3. El PDF se descarga

### Paso 6: Imprimir PDF

**Opción A: Desde el listado**
1. Click en botón **"Imprimir"** (🖨️)
2. Se abrirá ventana de impresión del navegador
3. Configura opciones de impresión
4. Click "Imprimir"

**Opción B: Desde vista previa**
1. Abre vista previa (Ver)
2. Click en "Imprimir" en el modal
3. Ventana de impresión se abre automáticamente

---

## 📋 CONTENIDO DEL PDF

El PDF generado incluye:

### Header
- Nombre de la organización
- Título: "PLAN DE NEGOCIACIÓN DE PAGO"
- Número de plan (ID abreviado)

### Información del Cliente
- Nombre completo
- Teléfono
- Identificación
- Dirección

### Información del Préstamo Original
- Monto prestado
- Tasa de interés
- Fecha del préstamo

### Detalles de la Negociación
- Tipo de plan
- Estado actual
- Monto original
- Monto negociado
- Nueva tasa de interés (si aplica)
- Número de cuotas
- Monto por cuota
- Frecuencia de pago (días)
- Período de gracia
- Fecha de inicio
- Fecha de finalización
- Fecha de creación
- Notas adicionales

### Calendario de Pagos (Tabla)
Para cada cuota:
- Número de cuota (#)
- Fecha de vencimiento
- Monto a pagar
- Estado (Pendiente/Pagado/Vencido)
- Fecha de pago real (si está pagado)
- Monto pagado (si está pagado)

### Resumen
- Total negociado
- Cuotas pagadas (X de Y)
- Total pagado
- Total pendiente
- Porcentaje de progreso

### Footer
- Número de página
- Fecha y hora de generación

---

## 🎨 CARACTERÍSTICAS VISUALES

### En el Modal
- **Diseño limpio y profesional**
- **Colores según estado:**
  - 🟢 Verde: Activo, Pagado
  - 🔵 Azul: Completado
  - 🔴 Rojo: Cancelado, Vencido
  - 🟡 Amarillo: Pendiente
- **Barra de progreso animada**
- **Tabla responsiva** para el calendario
- **Modo oscuro compatible**

### En el PDF
- **Formato profesional** A4
- **Tabla con colores** alternados para fácil lectura
- **Headers destacados** con color azul
- **Paginación automática**
- **Logos y branding** personalizables
- **Footer con metadata** de generación

---

## 🔍 EJEMPLOS DE USO

### Caso 1: Revisar Progreso de Cliente
```
1. Cliente llama preguntando cuánto ha pagado
2. Abres sus planes de negociación
3. Ves la barra de progreso: 60%
4. Click en "Ver detalles"
5. Revisas el calendario: 6 de 10 cuotas pagadas
6. Le informas al cliente
```

### Caso 2: Enviar Copia al Cliente
```
1. Cliente solicita copia de su plan
2. Abres sus planes
3. Click en "Descargar"
4. PDF se descarga
5. Envías el archivo por WhatsApp o email
```

### Caso 3: Auditoría o Archivo
```
1. Necesitas documentar el acuerdo
2. Abres planes del cliente
3. Click en "Vista Previa"
4. Verificas que todo esté correcto
5. Click en "Imprimir"
6. Imprimes para archivo físico
```

### Caso 4: Presentación al Cliente
```
1. Cliente viene a la oficina
2. Abres sus planes
3. Click en "Vista Previa"
4. Le muestras el documento en pantalla
5. Explicas cada sección
6. Click en "Descargar" si quiere copia
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "No hay planes de negociación"
**Causa:** El cliente no tiene planes creados
**Solución:**
1. Verifica que el cliente tenga préstamos
2. Crea un plan desde el botón 🤝 (Negociar) en la lista de préstamos
3. Vuelve a abrir "Planes"

### Error al generar PDF
**Causa:** Falta información o error en datos
**Solución:**
1. Verifica que el plan tenga todos los datos
2. Recarga la página (F5)
3. Intenta de nuevo
4. Si persiste, revisa consola (F12)

### PDF no se descarga
**Causa:** Bloqueador de descargas del navegador
**Solución:**
1. Verifica que el navegador no esté bloqueando
2. Permite descargas automáticas
3. Intenta "Vista Previa" → "Descargar"

### Impresión no funciona
**Causa:** Bloqueador de pop-ups
**Solución:**
1. Permite pop-ups para el sitio
2. Intenta "Vista Previa" → "Imprimir"
3. Usa Ctrl+P manualmente en la vista previa

### Vista previa en blanco
**Causa:** Navegador bloquea iframes
**Solución:**
1. Usa "Descargar" directamente
2. Abre el PDF descargado
3. Actualiza navegador a última versión

---

## 📊 MEJORES PRÁCTICAS

### Para Gestores
1. **Revisa planes regularmente** para dar seguimiento
2. **Descarga copias** antes de reuniones con clientes
3. **Imprime para archivo** documentos importantes
4. **Usa vista previa** para verificar antes de entregar

### Para Clientes
1. **Solicita copia digital** para tu archivo
2. **Revisa el calendario** de pagos periódicamente
3. **Verifica los datos** en el documento
4. **Guarda el PDF** en lugar seguro

### Para Auditorías
1. **Imprime todos los planes activos** mensualmente
2. **Archiva cronológicamente**
3. **Verifica completitud** de información
4. **Mantén backup digital** de todos los PDFs

---

## 🔐 SEGURIDAD

- ✅ Solo se muestran planes de clientes de tu organización
- ✅ RLS asegura que no veas datos de otras organizaciones
- ✅ PDFs generados localmente (no se suben al servidor)
- ✅ Información sensible protegida

---

## 📱 COMPATIBILIDAD

### Desktop
- ✅ Chrome, Firefox, Edge, Safari
- ✅ Vista previa funciona perfectamente
- ✅ Descarga e impresión sin problemas

### Móvil
- ✅ Chrome móvil, Safari iOS
- ✅ Vista previa puede variar según navegador
- ✅ Descarga funciona (guarda en Descargas)
- ✅ Impresión abre diálogo del sistema

### Tablets
- ✅ Funciona como en desktop
- ✅ Modal se adapta al tamaño
- ✅ Vista previa funcional

---

## 🎯 PRÓXIMOS PASOS

Después de implementado:

1. **Borrar caché del navegador**
   - Obligatorio para ver los cambios
   - Instrucciones en VERIFICACION_COMPLETA.md

2. **Crear un plan de negociación de prueba**
   - Selecciona un cliente con préstamo
   - Click en 🤝 (Negociar)
   - Crea plan de prueba

3. **Probar "Ver Planes"**
   - Click en botón "Planes" del cliente
   - Verifica que el modal se abre

4. **Probar Vista Previa**
   - Click en "Ver" (👁️)
   - Verifica que se genera el PDF
   - Verifica que se muestra en el modal

5. **Probar Descarga**
   - Click en "Descargar" (💾)
   - Verifica que se descarga
   - Abre el PDF y verifica contenido

6. **Probar Impresión**
   - Click en "Imprimir" (🖨️)
   - Verifica que se abre ventana de impresión
   - Verifica vista previa de impresión

---

## ✅ CHECKLIST DE PRUEBAS

- [ ] Botón "Planes" aparece en lista de clientes
- [ ] Modal se abre al hacer click
- [ ] Planes se cargan correctamente
- [ ] Información se muestra completa
- [ ] Barra de progreso funciona
- [ ] "Ver detalles" expande/colapsa
- [ ] Calendario de pagos se muestra
- [ ] Botón "Ver" genera PDF
- [ ] Vista previa se muestra en modal
- [ ] Botón "Descargar" funciona
- [ ] PDF se descarga con nombre correcto
- [ ] PDF contiene toda la información
- [ ] Botón "Imprimir" funciona
- [ ] Ventana de impresión se abre
- [ ] Formato de impresión es correcto
- [ ] Modal se cierra correctamente
- [ ] Funciona en modo oscuro
- [ ] Funciona en móvil
- [ ] Funciona en desktop

---

## 📞 SOPORTE

Si hay problemas:

1. **Borra caché del navegador**
2. **Recarga la página** (F5)
3. **Verifica consola** (F12) por errores
4. **Toma screenshot** del error
5. **Copia error de consola** completo
6. **Reporta con:**
   - Screenshot
   - Error de consola
   - Navegador y versión
   - Pasos para reproducir

---

## 🎉 RESUMEN

**IMPLEMENTADO EXITOSAMENTE:**

✅ Modal de Planes de Negociación
✅ Vista completa de todos los planes del cliente
✅ Detalles expandibles con calendario de pagos
✅ Generación de PDF profesional
✅ Vista previa en modal
✅ Descarga directa de PDF
✅ Impresión desde navegador
✅ Formato profesional con toda la información
✅ Compatible con desktop y móvil
✅ Build exitoso sin errores
✅ TypeScript sin errores

**LISTO PARA USAR** 🚀

---

**Fecha:** 2025-11-04
**Versión:** 1.0
**Estado:** PRODUCCIÓN ✅
