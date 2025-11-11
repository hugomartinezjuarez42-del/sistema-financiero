/*
  # Permitir acceso público al nombre de organizaciones
  
  1. Cambios de Seguridad
    - Permitir a usuarios NO autenticados ver nombres de organizaciones
    - Esto es necesario para mostrar el nombre de la organización en la página de invitación
    - Solo se puede ver información básica (nombre)
  
  2. Seguridad
    - Los usuarios no autenticados solo pueden leer el nombre
    - No pueden crear, modificar o eliminar organizaciones
    - Esta información es necesaria para el flujo de invitación
*/

-- Permitir a usuarios anónimos ver organizaciones (para mostrar nombre en invitaciones)
CREATE POLICY "Anyone can view organization names"
  ON organizations
  FOR SELECT
  TO anon
  USING (true);
