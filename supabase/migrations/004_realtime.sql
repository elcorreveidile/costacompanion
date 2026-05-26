-- Habilitar Realtime en las tablas de reservas y solicitudes
-- Necesario para que los cambios se propaguen en tiempo real al cliente

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'solicitudes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes;
  END IF;
END $$;
