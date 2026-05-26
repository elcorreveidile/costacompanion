-- Bucket público para fotos de acompañantes
-- Se crea solo si no existe (idempotente)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-acompanantes',
  'fotos-acompanantes',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
