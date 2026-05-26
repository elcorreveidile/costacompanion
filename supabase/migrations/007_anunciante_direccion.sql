-- =============================================================================
-- Costa Companion — Migración 007: Campo dirección en anunciantes
-- =============================================================================

ALTER TABLE anunciantes ADD COLUMN IF NOT EXISTS direccion text;
