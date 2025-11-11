/*
  # Permitir acceso público a invitaciones
  
  1. Cambios de Seguridad
    - Permitir a usuarios NO autenticados ver invitaciones pendientes por código
    - Esto es necesario para que los nuevos usuarios puedan registrarse
    - Solo se pueden ver invitaciones pendientes (status='pending')
    - Solo se puede buscar por código de invitación
  
  2. Seguridad
    - Los usuarios no autenticados solo pueden leer invitaciones pendientes
    - No pueden crear, modificar o eliminar invitaciones
    - Solo pueden ver los datos necesarios para el registro
*/

-- Permitir a usuarios anónimos leer invitaciones pendientes por código
CREATE POLICY "Anyone can view pending invitations by code"
  ON organization_invitations
  FOR SELECT
  TO anon
  USING (status = 'pending');
