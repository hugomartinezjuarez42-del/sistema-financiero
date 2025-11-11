/*
  # Sistema de Invitaciones para Organizaciones

  ## Descripción
  Permite a los administradores de organizaciones invitar a otros usuarios
  a unirse a su organización para compartir datos y colaborar.

  ## Nuevas Tablas
  1. `organization_invitations`
    - `id` (uuid, primary key) - Identificador único de la invitación
    - `organization_id` (uuid, foreign key) - Organización que envía la invitación
    - `invited_email` (text) - Email del usuario invitado
    - `invited_by` (uuid, foreign key) - Usuario que envió la invitación
    - `role` (text) - Rol que tendrá el usuario invitado ('admin' o 'member')
    - `status` (text) - Estado de la invitación ('pending', 'accepted', 'rejected')
    - `invitation_code` (text, unique) - Código único para aceptar la invitación
    - `expires_at` (timestamptz) - Fecha de expiración de la invitación
    - `created_at` (timestamptz) - Fecha de creación
    - `accepted_at` (timestamptz) - Fecha de aceptación

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Solo admins pueden crear invitaciones
  - Los usuarios pueden ver invitaciones dirigidas a su email
  - Los admins pueden ver todas las invitaciones de su organización
  - Sistema de códigos únicos para seguridad

  ## Funcionalidades
  1. Los admins pueden invitar usuarios por email
  2. Las invitaciones expiran en 7 días
  3. Los usuarios invitados se unen automáticamente al aceptar
  4. Se actualiza el trigger para NO crear org si hay invitación pendiente
*/

-- =====================================================
-- 1. CREAR TABLA DE INVITACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invitation_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(organization_id, invited_email, status)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invitations_email ON organization_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON organization_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON organization_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON organization_invitations(organization_id);

-- =====================================================
-- 2. HABILITAR RLS
-- =====================================================

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. POLÍTICAS RLS PARA INVITACIONES
-- =====================================================

-- Los admins pueden crear invitaciones en su organización
CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'admin'
    )
  );

-- Los admins pueden ver invitaciones de su organización
CREATE POLICY "Admins can view organization invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'admin'
    )
  );

-- Los usuarios pueden ver invitaciones enviadas a su email
CREATE POLICY "Users can view their invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Los admins pueden actualizar invitaciones de su organización
CREATE POLICY "Admins can update organization invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'admin'
    )
  );

-- Los usuarios pueden aceptar/rechazar sus propias invitaciones
CREATE POLICY "Users can respond to their invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Los admins pueden eliminar invitaciones
CREATE POLICY "Admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_invitations.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'admin'
    )
  );

-- =====================================================
-- 4. FUNCIÓN PARA ACEPTAR INVITACIONES
-- =====================================================

CREATE OR REPLACE FUNCTION accept_invitation(invitation_code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record record;
  current_user_email text;
  result jsonb;
BEGIN
  -- Obtener email del usuario actual
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Buscar invitación válida
  SELECT * INTO invitation_record
  FROM organization_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > now()
    AND invited_email = current_user_email;

  -- Verificar que existe
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitación no válida, expirada o no corresponde a tu email'
    );
  END IF;

  -- Verificar si el usuario ya es miembro
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND organization_id = invitation_record.organization_id
  ) THEN
    -- Marcar invitación como aceptada de todos modos
    UPDATE organization_invitations
    SET status = 'accepted',
        accepted_at = now()
    WHERE id = invitation_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Ya eres miembro de esta organización'
    );
  END IF;

  -- Agregar usuario a la organización
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (
    invitation_record.organization_id,
    auth.uid(),
    invitation_record.role,
    now()
  );

  -- Marcar invitación como aceptada
  UPDATE organization_invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- 5. FUNCIÓN PARA EXPIRAR INVITACIONES AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organization_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$;

-- =====================================================
-- 6. ACTUALIZAR TRIGGER DE CREACIÓN DE USUARIOS
-- =====================================================

-- Actualizar la función para verificar invitaciones pendientes
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  existing_org_id uuid;
  pending_invitation record;
BEGIN
  -- Verificar si el usuario ya tiene una organización
  SELECT organization_id INTO existing_org_id
  FROM organization_members 
  WHERE user_id = NEW.id
  LIMIT 1;
  
  IF existing_org_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar si hay invitaciones pendientes para este email
  SELECT * INTO pending_invitation
  FROM organization_invitations
  WHERE invited_email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  -- Si hay invitación pendiente, NO crear organización nueva
  -- El usuario debe aceptar la invitación manualmente
  IF pending_invitation IS NOT NULL THEN
    RAISE NOTICE 'User % has pending invitation, skipping org creation', NEW.email;
    RETURN NEW;
  END IF;
  
  -- Crear nueva organización solo si no hay invitaciones
  INSERT INTO organizations (name, created_by, created_at)
  VALUES ('Mi Organización', NEW.id, now())
  RETURNING id INTO new_org_id;
  
  -- Agregar usuario como admin
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (new_org_id, NEW.id, 'admin', now());
  
  RAISE NOTICE 'Auto-created organization % for new user %', new_org_id, NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating organization for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- 7. FUNCIÓN AUXILIAR PARA OBTENER INVITACIONES DEL USUARIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_my_invitations()
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  organization_name text,
  invited_by_email text,
  role text,
  invitation_code text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.organization_id,
    o.name as organization_name,
    u.email as invited_by_email,
    i.role,
    i.invitation_code,
    i.expires_at,
    i.created_at
  FROM organization_invitations i
  JOIN organizations o ON i.organization_id = o.id
  JOIN auth.users u ON i.invited_by = u.id
  WHERE i.invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND i.status = 'pending'
    AND i.expires_at > now()
  ORDER BY i.created_at DESC;
END;
$$;
