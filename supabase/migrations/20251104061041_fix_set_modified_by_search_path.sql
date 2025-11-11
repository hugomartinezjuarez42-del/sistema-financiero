/*
  # Fix set_modified_by function search_path
  
  1. Changes
    - Add explicit search_path to set_modified_by function
    - Prevents security issues with mutable search paths
  
  2. Security
    - SECURITY DEFINER functions must have immutable search_path
    - Prevents search_path manipulation attacks
*/

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION set_modified_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  NEW.modified_by := auth.uid();
  RETURN NEW;
END;
$$;
