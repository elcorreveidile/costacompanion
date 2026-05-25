-- =============================================================================
-- Costa Companion — Migración 002: Catálogo de service_categories
-- =============================================================================
-- Fuente: Parte 4 del documento maestro.
-- Nombres multilingües en jsonb: {es, en, fr, de, nl}
-- =============================================================================

INSERT INTO service_categories (key, grupo, nombre) VALUES

-- ── Trámites administrativos y legales ────────────────────────────────────────

('policia-permisos', 'tramites', '{
  "es": "Policía / permisos",
  "en": "Police / permits",
  "fr": "Police / permis",
  "de": "Polizei / Genehmigungen",
  "nl": "Politie / vergunningen"
}'::jsonb),

('denuncias', 'tramites', '{
  "es": "Denuncias",
  "en": "Police reports",
  "fr": "Plaintes",
  "de": "Anzeigen",
  "nl": "Aangifte"
}'::jsonb),

('extranjeria-nie', 'tramites', '{
  "es": "Extranjería / NIE",
  "en": "Immigration / NIE",
  "fr": "Immigration / NIE",
  "de": "Ausländerbehörde / NIE",
  "nl": "Vreemdelingenzaken / NIE"
}'::jsonb),

('empadronamiento', 'tramites', '{
  "es": "Empadronamiento",
  "en": "Residency registration",
  "fr": "Inscription au registre communal",
  "de": "Einwohnermeldeamt",
  "nl": "Inschrijving gemeente"
}'::jsonb),

('notaria-gestoria', 'tramites', '{
  "es": "Notaría / gestoría",
  "en": "Notary / legal admin",
  "fr": "Notaire / gestion administrative",
  "de": "Notar / Verwaltung",
  "nl": "Notaris / administratie"
}'::jsonb),

('banca', 'tramites', '{
  "es": "Banca",
  "en": "Banking",
  "fr": "Banque",
  "de": "Bankwesen",
  "nl": "Bankzaken"
}'::jsonb),

('citas-oficiales', 'tramites', '{
  "es": "Citas oficiales",
  "en": "Official appointments",
  "fr": "Rendez-vous officiels",
  "de": "Behördentermine",
  "nl": "Officiële afspraken"
}'::jsonb),

-- ── Salud ─────────────────────────────────────────────────────────────────────

('acompanamiento-medico', 'salud', '{
  "es": "Acompañamiento médico",
  "en": "Medical accompaniment",
  "fr": "Accompagnement médical",
  "de": "Medizinische Begleitung",
  "nl": "Medische begeleiding"
}'::jsonb),

-- ── Propiedad ─────────────────────────────────────────────────────────────────

('compraventa-propiedad', 'propiedad', '{
  "es": "Compraventa de propiedades",
  "en": "Property purchase / sale",
  "fr": "Achat / vente de propriété",
  "de": "Immobilienkauf / -verkauf",
  "nl": "Aan- en verkoop vastgoed"
}'::jsonb),

-- ── Otros ─────────────────────────────────────────────────────────────────────

('interpretacion-telefonica', 'otros', '{
  "es": "Interpretación telefónica urgente",
  "en": "Urgent phone interpretation",
  "fr": "Interprétation téléphonique urgente",
  "de": "Dringende Telefondolmetschung",
  "nl": "Urgente telefonische tolkendienst"
}'::jsonb),

('preparacion-entrevista', 'otros', '{
  "es": "Preparación de entrevista de trabajo",
  "en": "Job interview preparation",
  "fr": "Préparation d''entretien d''embauche",
  "de": "Vorbereitung Vorstellungsgespräch",
  "nl": "Sollicitatiegesprek voorbereiding"
}'::jsonb),

('clases-espanol', 'otros', '{
  "es": "Clases de español",
  "en": "Spanish lessons",
  "fr": "Cours d''espagnol",
  "de": "Spanischunterricht",
  "nl": "Spaanse lessen"
}'::jsonb);
