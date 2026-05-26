-- Habilitar Realtime en las tablas de reservas y solicitudes
-- Necesario para que los cambios se propaguen en tiempo real al cliente

ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes;
