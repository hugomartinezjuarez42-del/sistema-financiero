# 🧪 PRUEBA: Sistema de Capital e Interés en Planes de Negociación

## ✅ IMPLEMENTADO

Se ha modificado completamente el sistema de negociación de pago para calcular y mostrar el desglose de **CAPITAL** e **INTERÉS** en cada cuota.

---

## 🎯 CAMBIOS REALIZADOS

### 1. Base de Datos ✅
**Nueva Migración:** `add_capital_interest_to_plan_payments`

Se agregaron dos columnas a `plan_payments`:
- `capital_amount` (numeric) - Monto que va a capital/principal
- `interest_amount` (numeric) - Monto que va a interés

**Fórmula:**
```
amount (total) = capital_amount + interest_amount
```

### 2. Componente PaymentNegotiation ✅
**Cambios principales:**
- Nuevo campo: "Tasa de Interés por Cuota (%)" (default: 2%)
- Cálculo automático de capital e interés por cuota
- Tabla muestra 5 columnas: #, Fecha, Capital, Interés, Total
- Resumen muestra: Total Capital, Total Interés, Total a Pagar
- Colores: Capital (azul), Interés (naranja), Total (negro)

**Lógica de cálculo:**
```typescript
Capital por cuota = Monto Negociado / Número de Cuotas
Interés por cuota = Capital por cuota × (Tasa % / 100)
Total por cuota = Capital + Interés
```

### 3. PaymentPlanPDF ✅
**PDF actualizado:**
- Tabla con columnas: #, Fecha, Capital, Interés, Total, Estado, F. Pago, Pagado
- Capital en azul, Interés en naranja
- Totales al final de la tabla

### 4. PaymentPlansModal ✅
**Modal actualizado:**
- Tabla con desglose completo
- Colores diferenciados para capital e interés
- Vista clara del desglose

---

## 📋 GUÍA DE PRUEBA PASO A PASO

### Preparación
1. **Borra caché del navegador** (OBLIGATORIO)
2. Cierra la app completamente
3. Vuelve a abrir
4. Espera 20 segundos a que cargue

### Prueba 1: Crear Plan con Desglose

**Datos de ejemplo para la prueba:**
- Cliente: Cualquier cliente con préstamo activo
- Monto Negociado (Capital): L. 10,000
- Tasa de Interés por Cuota: 2%
- Número de Cuotas: 4
- Frecuencia: 15 días

**Cálculos esperados:**
```
Capital por cuota = 10,000 / 4 = L. 2,500.00
Interés por cuota = 2,500 × 0.02 = L. 50.00
Total por cuota = 2,500 + 50 = L. 2,550.00

Total Capital (4 cuotas) = L. 10,000.00
Total Interés (4 cuotas) = L. 200.00
Total a Pagar = L. 10,200.00
```

**Pasos:**

1. **Abre un cliente con préstamo**
   - Busca un cliente
   - Expande sus detalles

2. **Abre negociación**
   - En la lista de préstamos, busca el botón 🤝 (Negociar)
   - Click en el botón

3. **Verifica interfaz nueva**
   - ✅ Debe aparecer campo "Tasa de Interés por Cuota (%)"
   - ✅ Valor default: 2%
   - ✅ Tooltip: "Este porcentaje se aplicará sobre el capital de cada cuota"

4. **Llena el formulario**
   - Tipo de Plan: "Plan Personalizado"
   - Monto Negociado (Capital): 10000
   - Tasa de Interés por Cuota (%): 2
   - Número de Cuotas: 4
   - Frecuencia (días): 15
   - Período de Gracia: 0
   - Fecha de Inicio: (hoy)

5. **Verifica Resumen del Plan**
   - ✅ Cuota por Pago debe mostrar:
     - Total: L. 2,550.00
     - Capital: L. 2,500.00
     - Interés: L. 50.00
   - ✅ Total Capital: L. 10,000.00
   - ✅ Total Interés: L. 200.00
   - ✅ Total a Pagar: L. 10,200.00

6. **Verifica Calendario de Pagos**
   - Debe mostrar tabla con 5 columnas:
     - # | Fecha | Capital | Interés | Total
   - ✅ Cada fila debe mostrar:
     - Capital: L. 2,500.00 (color azul)
     - Interés: L. 50.00 (color naranja)
     - Total: L. 2,550.00 (negrita)
   - ✅ Fila TOTALES al final:
     - Capital: L. 10,000.00
     - Interés: L. 200.00
     - Total: L. 10,200.00

7. **Crear el plan**
   - Click en "Crear Plan de Pago"
   - Espera mensaje: "Plan de pago creado exitosamente con desglose de capital e interés"
   - ✅ Debe cerrarse el modal

### Prueba 2: Ver Plan Creado

1. **Abre planes del cliente**
   - Click en botón "Planes" del cliente (botón morado)

2. **Verifica que el plan aparece**
   - ✅ Debe aparecer en la lista
   - ✅ Monto negociado: L. 10,000.00
   - ✅ Cuotas: 4
   - ✅ Por cuota: L. 2,550.00

3. **Expande los detalles**
   - Click en "Ver detalles"

4. **Verifica tabla de calendario**
   - ✅ 8 columnas: #, Fecha, Capital, Interés, Total, Estado, F. Pago, Pagado
   - ✅ Capital en azul: L. 2,500.00
   - ✅ Interés en naranja: L. 50.00
   - ✅ Total en negrita: L. 2,550.00
   - ✅ 4 filas (una por cuota)

### Prueba 3: PDF con Desglose

1. **Genera vista previa**
   - En el plan, click en botón "Ver" (👁️)
   - Espera a que se genere el PDF

2. **Verifica contenido del PDF**
   - ✅ Debe abrir modal con iframe
   - ✅ Tabla del calendario debe mostrar:
     - # | Fecha | Capital | Interés | Total | Estado | F. Pago | Pagado
   - ✅ Capital en color azul
   - ✅ Interés en color naranja
   - ✅ Valores correctos por fila

3. **Descarga el PDF**
   - Click en "Descargar" desde la vista previa
   - Abre el archivo descargado
   - ✅ Verifica que la tabla tiene todos los datos
   - ✅ Verifica colores se mantienen

4. **Imprime el PDF**
   - Click en "Imprimir" desde la vista previa
   - ✅ Se abre ventana de impresión
   - ✅ Vista previa muestra tabla correctamente

---

## 🧮 EJEMPLOS DE CÁLCULO

### Ejemplo 1: Tasa 2%
```
Capital Negociado: L. 10,000
Cuotas: 4
Tasa: 2%

Capital/cuota = 10,000 / 4 = L. 2,500.00
Interés/cuota = 2,500 × 0.02 = L. 50.00
Total/cuota = L. 2,550.00

Total Capital = L. 10,000.00
Total Interés = L. 200.00
Total a Pagar = L. 10,200.00
```

### Ejemplo 2: Tasa 3%
```
Capital Negociado: L. 20,000
Cuotas: 5
Tasa: 3%

Capital/cuota = 20,000 / 5 = L. 4,000.00
Interés/cuota = 4,000 × 0.03 = L. 120.00
Total/cuota = L. 4,120.00

Total Capital = L. 20,000.00
Total Interés = L. 600.00
Total a Pagar = L. 20,600.00
```

### Ejemplo 3: Tasa 1.5%
```
Capital Negociado: L. 15,000
Cuotas: 6
Tasa: 1.5%

Capital/cuota = 15,000 / 6 = L. 2,500.00
Interés/cuota = 2,500 × 0.015 = L. 37.50
Total/cuota = L. 2,537.50

Total Capital = L. 15,000.00
Total Interés = L. 225.00
Total a Pagar = L. 15,225.00
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Interfaz de Negociación
- [ ] Campo "Tasa de Interés por Cuota (%)" existe
- [ ] Valor default es 2%
- [ ] Tooltip explicativo está presente
- [ ] Campo permite decimales (0.1, 2.5, etc.)

### Cálculos en Tiempo Real
- [ ] Resumen muestra "Cuota por Pago" con desglose
- [ ] Total Capital se calcula correctamente
- [ ] Total Interés se calcula correctamente
- [ ] Total a Pagar = Capital + Interés

### Tabla de Calendario (Negociación)
- [ ] 5 columnas: #, Fecha, Capital, Interés, Total
- [ ] Capital en color azul
- [ ] Interés en color naranja
- [ ] Total en negrita
- [ ] Fila TOTALES al final con sumas correctas

### Guardado en Base de Datos
- [ ] Plan se guarda correctamente
- [ ] Mensaje de éxito aparece
- [ ] Modal se cierra

### Visualización del Plan
- [ ] Botón "Planes" muestra el plan creado
- [ ] Expandir muestra tabla con 8 columnas
- [ ] Desglose de capital e interés visible
- [ ] Colores correctos (azul/naranja)

### PDF Generado
- [ ] Vista previa funciona
- [ ] Tabla incluye columnas Capital e Interés
- [ ] Colores se mantienen en PDF
- [ ] Descarga funciona
- [ ] Impresión funciona
- [ ] Datos son correctos

---

## 🔍 VALIDACIÓN DE DATOS

Para verificar que los datos se guardaron correctamente en la base de datos:

```sql
-- Ver plan creado
SELECT
  id,
  negotiated_amount,
  new_interest_rate,
  installments,
  installment_amount,
  created_at
FROM payment_plans
ORDER BY created_at DESC
LIMIT 1;

-- Ver pagos con desglose
SELECT
  installment_number as cuota,
  amount as total,
  capital_amount as capital,
  interest_amount as interes,
  due_date as fecha
FROM plan_payments
WHERE plan_id = 'ID_DEL_PLAN'
ORDER BY installment_number;

-- Verificar que suma es correcta
SELECT
  SUM(capital_amount) as total_capital,
  SUM(interest_amount) as total_interes,
  SUM(amount) as total_pagar
FROM plan_payments
WHERE plan_id = 'ID_DEL_PLAN';
```

**Resultado esperado** (ejemplo con 10,000 a 2%):
```
total_capital: 10000.00
total_interes: 200.00
total_pagar: 10200.00
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### No veo el campo de tasa de interés
**Causa:** Caché viejo
**Solución:**
1. Borra caché completamente
2. Cierra app
3. Vuelve a abrir
4. Espera 20 segundos

### Los cálculos no coinciden
**Causa:** Error en la fórmula o datos incorrectos
**Verificación:**
1. Capital/cuota = Monto Negociado ÷ Número de Cuotas
2. Interés/cuota = (Capital/cuota) × (Tasa% ÷ 100)
3. Total/cuota = Capital + Interés
4. Verifica con calculadora externa

### PDF no muestra columnas nuevas
**Causa:** Caché del navegador
**Solución:**
1. Cierra modal de vista previa
2. Recarga página (F5)
3. Vuelve a generar PDF

### Error al guardar plan
**Causa:** Migración no aplicada
**Verificación:**
```sql
-- Verificar que columnas existen
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'plan_payments'
  AND column_name IN ('capital_amount', 'interest_amount');
```
Debe devolver 2 filas.

---

## 📊 RESULTADO ESPERADO

Al final de la prueba deberías tener:

✅ **Un plan de negociación creado con:**
- Monto negociado (capital): visible
- Tasa de interés: configurada (ej: 2%)
- Desglose por cuota: capital + interés = total
- Tabla completa con todas las cuotas

✅ **Visualización correcta:**
- En modal de negociación
- En modal de planes
- En PDF descargado
- En impresión

✅ **Cálculos correctos:**
- Suma de capital = monto negociado
- Suma de interés = calculado por tasa
- Suma total = capital + interés

✅ **Colores distintivos:**
- Capital: azul
- Interés: naranja
- Total: negro/negrita

---

## 🎯 CRITERIOS DE ÉXITO

La prueba es exitosa si:

1. ✅ Puedes crear un plan con tasa de interés personalizada
2. ✅ El resumen muestra desglose correcto de capital e interés
3. ✅ La tabla del calendario muestra 5 columnas con datos correctos
4. ✅ El plan se guarda en la base de datos
5. ✅ Puedes ver el plan con desglose completo
6. ✅ El PDF muestra toda la información con colores
7. ✅ La descarga e impresión funcionan correctamente
8. ✅ Los cálculos matemáticos son precisos

---

## 📞 REPORTE DE RESULTADOS

Después de completar la prueba, reporta:

**✅ FUNCIONA:**
- [ ] Campo de tasa de interés visible
- [ ] Cálculos correctos en tiempo real
- [ ] Tabla muestra desglose
- [ ] Plan se guarda correctamente
- [ ] Modal de planes muestra desglose
- [ ] PDF incluye desglose
- [ ] Descarga funciona
- [ ] Impresión funciona

**❌ PROBLEMAS:**
- Screenshot del error (si hay)
- Error de consola (F12)
- Pasos para reproducir
- Navegador y versión

---

**Fecha:** 2025-11-04
**Versión:** 1.0 con Capital/Interés
**Estado:** LISTO PARA PRUEBAS ✅
