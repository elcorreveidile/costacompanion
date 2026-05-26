-- 005: añade función mi_anunciante_id() necesaria para RLS de anunciantes
-- (La tabla, enums y políticas ya están en 001_init.sql)

CREATE OR REPLACE FUNCTION mi_anunciante_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM anunciantes WHERE profile_id = auth.uid() LIMIT 1;
$$;
