/*
  # Step 1: Drop all policies that use user_has_permission
  
  1. Changes
    - Drop all policies from clients, loans, and payments tables
    - This allows us to modify the function in the next step
*/

-- Drop clients policies
DROP POLICY IF EXISTS "Members can create clients" ON clients;
DROP POLICY IF EXISTS "Members can update clients" ON clients;
DROP POLICY IF EXISTS "Managers can delete clients" ON clients;
DROP POLICY IF EXISTS "Users can view organization clients" ON clients;

-- Drop loans policies
DROP POLICY IF EXISTS "Members can create loans" ON loans;
DROP POLICY IF EXISTS "Members can update loans" ON loans;
DROP POLICY IF EXISTS "Managers can delete loans" ON loans;
DROP POLICY IF EXISTS "Users can view organization loans" ON loans;

-- Drop payments policies
DROP POLICY IF EXISTS "Members can create payments" ON payments;
DROP POLICY IF EXISTS "Members can update payments" ON payments;
DROP POLICY IF EXISTS "Managers can delete payments" ON payments;
DROP POLICY IF EXISTS "Users can view organization payments" ON payments;
