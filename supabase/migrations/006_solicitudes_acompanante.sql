-- =============================================================================
-- Costa Companion — Migración 006: Solicitudes de candidatos a acompañante
-- =============================================================================

CREATE TABLE IF NOT EXISTS solicitudes_acompanante (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  email      text        NOT NULL,
  telefono   text,
  idiomas    text[]      NOT NULL DEFAULT '{}',
  zona       text,
  mensaje    text,
  leida      boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE solicitudes_acompanante ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (formulario público anónimo)
CREATE POLICY "public_insert_solicitudes_acompanante"
  ON solicitudes_acompanante FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- La lectura/gestión se hace exclusivamente desde el cliente admin (service_role),
-- que bypasea RLS. No se necesita política SELECT para roles normales.
