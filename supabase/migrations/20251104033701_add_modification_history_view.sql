/*
  # Add Modification History View

  1. New View
    - modification_history: Shows who modified what and when
    - Combines data from clients, loans, and payments
    - Shows email of person who made the change

  2. Security
    - Only accessible to authenticated organization members
*/

-- Create view to see modification history
CREATE OR REPLACE VIEW modification_history AS
SELECT 
  'cliente' as tipo_registro,
  c.id as registro_id,
  c.name as nombre_registro,
  c.updated_at as fecha_modificacion,
  u.email as modificado_por,
  c.organization_id
FROM clients c
LEFT JOIN auth.users u ON u.id = c.modified_by
WHERE c.modified_by IS NOT NULL

UNION ALL

SELECT 
  'prestamo' as tipo_registro,
  l.id as registro_id,
  'Préstamo de $' || l.amount::text as nombre_registro,
  l.updated_at as fecha_modificacion,
  u.email as modificado_por,
  l.organization_id
FROM loans l
LEFT JOIN auth.users u ON u.id = l.modified_by
WHERE l.modified_by IS NOT NULL

UNION ALL

SELECT 
  'pago' as tipo_registro,
  p.id as registro_id,
  'Pago de $' || p.amount::text as nombre_registro,
  p.created_at as fecha_modificacion,
  u.email as modificado_por,
  p.organization_id
FROM payments p
LEFT JOIN auth.users u ON u.id = p.modified_by
WHERE p.modified_by IS NOT NULL

ORDER BY fecha_modificacion DESC;

-- Grant permissions
GRANT SELECT ON modification_history TO authenticated;

-- Add RLS policy for modification_history
ALTER VIEW modification_history SET (security_invoker = on);
