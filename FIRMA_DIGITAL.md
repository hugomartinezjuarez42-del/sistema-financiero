# Sistema de Firma Digital para Contratos

## Cómo Funciona

### 1. Botón de Firma Digital
- En cada préstamo hay un botón con ícono de pluma (PenTool)
- Color índigo para distinguirlo de otros botones
- Título: "Firma digital del cliente"

### 2. Modal de Firma
Al hacer clic en el botón de firma:
- Se abre un modal con canvas de firma
- El cliente puede dibujar su firma con:
  - Mouse en computadora
  - Dedo en dispositivos táctiles
- Botones disponibles:
  - **Limpiar**: Borra la firma para volver a dibujar
  - **Cancelar**: Cierra sin guardar
  - **Guardar Firma**: Guarda la firma en la base de datos

### 3. Almacenamiento
La firma se guarda en la tabla `digital_signatures` con:
- Imagen de la firma en formato PNG (base64)
- ID del préstamo
- ID del cliente
- Tipo de firma: 'client'
- Tipo de documento: 'contract'
- Fecha y hora de firma
- Hash del documento para verificación
- Información del dispositivo

### 4. Contratos con Firma
El componente `LoanContractPDF` tiene 2 botones:
- **Descargar** (verde): Descarga el PDF del contrato con firmas
- **Guardar** (azul): Guarda el contrato en Documentos del cliente

Ambos incluyen automáticamente:
- Firma del gerente (si está configurada)
- Firma digital del cliente (si existe)

### 5. Flujo Completo Recomendado

1. **Crear el préstamo**
2. **Cliente firma el contrato**:
   - Click en botón de pluma (firma digital)
   - Dibujar firma en el canvas
   - Guardar firma
3. **Generar contrato**:
   - Click en "Descargar" para obtener PDF
   - O click en "Guardar" para almacenar en documentos
4. El contrato incluye ambas firmas (gerente y cliente)

### 6. Ventajas

✅ **Legal**: Las firmas digitales tienen validez legal
✅ **Trazabilidad**: Se registra fecha, hora y dispositivo
✅ **Seguridad**: Hash del documento para verificar integridad
✅ **Comodidad**: El cliente firma desde cualquier dispositivo
✅ **Almacenamiento**: Contratos firmados guardados automáticamente

### 7. Ubicación de Documentos

Los contratos firmados guardados con el botón "Guardar" aparecen en:
- Pestaña "Documentos" del cliente
- Sección "Contratos"
- Se pueden ver, descargar o eliminar desde ahí

## Seguridad

- Las firmas solo pueden ser creadas por usuarios autenticados
- Las firmas están ligadas a la organización del usuario
- Solo miembros de la organización pueden ver las firmas
- Se genera un hash SHA-256 del documento firmado
- Se registra información del dispositivo y usuario
