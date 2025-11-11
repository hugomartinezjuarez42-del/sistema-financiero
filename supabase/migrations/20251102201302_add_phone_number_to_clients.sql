/*
  # Agregar campo de número de celular a clientes

  1. Cambios en Tablas
    - `clients`
      - Agregar columna `phone_number` (text, opcional)
      - Permite almacenar el número de teléfono del cliente para contacto

  2. Notas
    - Campo opcional para no afectar registros existentes
    - Útil para enviar recibos por WhatsApp directamente
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE clients ADD COLUMN phone_number text;
  END IF;
END $$;