-- =============================================================================
-- Costa Companion — Migración 001: Esquema inicial
-- =============================================================================
-- Ejecutar en orden. Requiere extensión pgcrypto (disponible en Supabase).
-- =============================================================================

-- ── Tipos ENUM ────────────────────────────────────────────────────────────────

CREATE TYPE rol_usuario AS ENUM ('cliente', 'acompanante', 'anunciante', 'superadmin');
CREATE TYPE modalidad_servicio AS ENUM ('presencial', 'remoto', 'ambos');
CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmada', 'rechazada', 'cancelada', 'completada');
CREATE TYPE estado_solicitud AS ENUM ('pendiente', 'aceptada', 'rechazada');
CREATE TYPE estado_disponibilidad AS ENUM ('abierto', 'cerrado');
CREATE TYPE unidad_precio AS ENUM ('hora', 'servicio', 'sesion');
CREATE TYPE grupo_categoria AS ENUM ('tramites', 'salud', 'propiedad', 'otros');
CREATE TYPE categoria_anunciante AS ENUM ('inmobiliaria', 'salud', 'legal', 'restauracion', 'comercio', 'otros');
CREATE TYPE plan_anunciante AS ENUM ('basico', 'destacado');
CREATE TYPE estado_stripe AS ENUM ('sin_suscripcion', 'active', 'past_due', 'canceled', 'trialing');

-- ── Tablas ────────────────────────────────────────────────────────────────────

-- profiles — un perfil por usuario de Auth
CREATE TABLE profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  rol               rol_usuario NOT NULL DEFAULT 'cliente',
  nombre            text,
  telefono          text,
  idioma_preferido  text CHECK (idioma_preferido IN ('es','en','fr','de','nl')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- service_categories — catálogo extensible de categorías
CREATE TABLE service_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  grupo      grupo_categoria NOT NULL,
  nombre     jsonb NOT NULL DEFAULT '{}',  -- {es, en, fr, de, nl}
  created_at timestamptz NOT NULL DEFAULT now()
);

-- acompanantes — proveedor del servicio
CREATE TABLE acompanantes (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                  uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  slug                        text UNIQUE NOT NULL,
  nombre_publico              text NOT NULL,
  foto_url                    text,
  bio                         jsonb DEFAULT '{}',         -- {es, en, fr, de, nl}
  idiomas                     text[] NOT NULL DEFAULT '{}',
  zonas                       text[] NOT NULL DEFAULT '{}',
  modalidades                 modalidad_servicio[] NOT NULL DEFAULT '{}',
  email_contacto              text,
  whatsapp                    text,
  titulacion                  text,
  interprete_jurado           boolean NOT NULL DEFAULT false,
  anios_experiencia           int,
  imparte_clases              boolean NOT NULL DEFAULT false,
  valoracion_media            numeric(3,2),
  num_resenas                 int NOT NULL DEFAULT 0,
  activo                      boolean NOT NULL DEFAULT false,
  destacado                   boolean NOT NULL DEFAULT false,
  stripe_customer_id          text,
  stripe_subscription_id      text,
  stripe_subscription_status  estado_stripe NOT NULL DEFAULT 'sin_suscripcion',
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- servicios — oferta concreta de un acompañante
CREATE TABLE servicios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acompanante_id  uuid NOT NULL REFERENCES acompanantes ON DELETE CASCADE,
  categoria       uuid NOT NULL REFERENCES service_categories,
  titulo          jsonb NOT NULL DEFAULT '{}',       -- {es, en, fr, de, nl}
  descripcion     jsonb DEFAULT '{}',
  modalidad       modalidad_servicio NOT NULL,
  precio          numeric(10,2) NOT NULL CHECK (precio >= 0),
  unidad_precio   unidad_precio NOT NULL DEFAULT 'hora',
  es_clase        boolean NOT NULL DEFAULT false,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- paquetes_clases — bonos de clases (solo para servicios con es_clase=true)
CREATE TABLE paquetes_clases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id   uuid NOT NULL REFERENCES servicios ON DELETE CASCADE,
  num_sesiones  int NOT NULL CHECK (num_sesiones > 0),
  precio_total  numeric(10,2) NOT NULL CHECK (precio_total >= 0),
  activo        boolean NOT NULL DEFAULT true
);

-- disponibilidad — franjas horarias abiertas por el acompañante
CREATE TABLE disponibilidad (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acompanante_id  uuid NOT NULL REFERENCES acompanantes ON DELETE CASCADE,
  fecha_hora      timestamptz NOT NULL,
  duracion_min    int NOT NULL CHECK (duracion_min > 0),
  modalidad       modalidad_servicio NOT NULL,
  zona            text,
  estado          estado_disponibilidad NOT NULL DEFAULT 'abierto',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- reservas — cita concreta cliente ↔ acompañante
CREATE TABLE reservas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acompanante_id      uuid NOT NULL REFERENCES acompanantes ON DELETE RESTRICT,
  cliente_id          uuid NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  servicio_id         uuid REFERENCES servicios ON DELETE SET NULL,
  disponibilidad_id   uuid REFERENCES disponibilidad ON DELETE SET NULL,
  fecha_hora          timestamptz NOT NULL,
  modalidad           modalidad_servicio NOT NULL,
  zona                text,
  detalle_servicio    text,  -- dato sensible — RGPD art. 9; nunca en emails ni logs
  estado              estado_reserva NOT NULL DEFAULT 'pendiente',
  created_at          timestamptz NOT NULL DEFAULT now(),
  cancelada_at        timestamptz
);

-- solicitudes — solicitud a medida del cliente
CREATE TABLE solicitudes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acompanante_id      uuid NOT NULL REFERENCES acompanantes ON DELETE RESTRICT,
  cliente_id          uuid NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  descripcion         text NOT NULL,
  detalle_servicio    text,  -- dato sensible — RGPD art. 9; nunca en emails ni logs
  fecha_hora_deseada  timestamptz,
  modalidad           modalidad_servicio NOT NULL,
  zona                text,
  precio_propuesto    numeric(10,2) CHECK (precio_propuesto >= 0),
  estado              estado_solicitud NOT NULL DEFAULT 'pendiente',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- resenas — valoración del cliente tras el servicio
CREATE TABLE resenas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acompanante_id  uuid NOT NULL REFERENCES acompanantes ON DELETE CASCADE,
  cliente_id      uuid NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  reserva_id      uuid REFERENCES reservas ON DELETE SET NULL,
  puntuacion      int NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario      text,
  aprobada        boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- mensajes — chat interno
CREATE TABLE mensajes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id    uuid REFERENCES reservas ON DELETE SET NULL,
  solicitud_id  uuid REFERENCES solicitudes ON DELETE SET NULL,
  emisor_id     uuid NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  receptor_id   uuid NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  texto         text NOT NULL,
  leido         boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- anunciantes — Local Partners
CREATE TABLE anunciantes (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                  uuid REFERENCES profiles ON DELETE SET NULL,
  nombre_negocio              text NOT NULL,
  slug                        text UNIQUE NOT NULL,
  categoria                   categoria_anunciante NOT NULL,
  descripcion                 jsonb DEFAULT '{}',  -- {es, en, fr, de, nl}
  logo_url                    text,
  web                         text,
  telefono                    text,
  email                       text,
  whatsapp                    text,
  zona                        text,
  plan                        plan_anunciante NOT NULL DEFAULT 'basico',
  activo                      boolean NOT NULL DEFAULT false,
  stripe_customer_id          text,
  stripe_subscription_id      text,
  stripe_subscription_status  estado_stripe NOT NULL DEFAULT 'sin_suscripcion',
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slug_anunciante_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX ON acompanantes (activo, destacado);
CREATE INDEX ON acompanantes (profile_id);
CREATE INDEX ON servicios (acompanante_id);
CREATE INDEX ON servicios (categoria);
CREATE INDEX ON disponibilidad (acompanante_id, fecha_hora);
CREATE INDEX ON reservas (acompanante_id, estado);
CREATE INDEX ON reservas (cliente_id);
CREATE INDEX ON solicitudes (acompanante_id, estado);
CREATE INDEX ON resenas (acompanante_id, aprobada);
CREATE INDEX ON mensajes (reserva_id);
CREATE INDEX ON mensajes (emisor_id, receptor_id);
CREATE INDEX ON anunciantes (activo, plan);

-- ── Funciones helper ──────────────────────────────────────────────────────────

-- Devuelve el id del acompañante que pertenece al usuario autenticado, o null.
CREATE OR REPLACE FUNCTION mi_acompanante_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM acompanantes WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- Devuelve true si el usuario autenticado es un acompañante activo.
CREATE OR REPLACE FUNCTION es_acompanante_activo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM acompanantes
    WHERE profile_id = auth.uid() AND activo = true
  );
$$;

-- ── Trigger: crear profile al registrarse en Auth ─────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, rol, nombre, idioma_preferido)
  VALUES (
    NEW.id,
    'cliente',
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'idioma_preferido', 'es')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Triggers: agregación de reseñas ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalcular_valoracion(p_acompanante_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE acompanantes
  SET
    valoracion_media = (
      SELECT ROUND(AVG(puntuacion)::numeric, 2)
      FROM resenas
      WHERE acompanante_id = p_acompanante_id AND aprobada = true
    ),
    num_resenas = (
      SELECT COUNT(*)
      FROM resenas
      WHERE acompanante_id = p_acompanante_id AND aprobada = true
    )
  WHERE id = p_acompanante_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_resena_cambio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acompanante_id uuid;
BEGIN
  v_acompanante_id := COALESCE(NEW.acompanante_id, OLD.acompanante_id);
  PERFORM recalcular_valoracion(v_acompanante_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER resena_insert_update
  AFTER INSERT OR UPDATE OF puntuacion, aprobada ON resenas
  FOR EACH ROW EXECUTE FUNCTION trg_resena_cambio();

CREATE TRIGGER resena_delete
  AFTER DELETE ON resenas
  FOR EACH ROW EXECUTE FUNCTION trg_resena_cambio();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE acompanantes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE paquetes_clases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidad       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE anunciantes          ENABLE ROW LEVEL SECURITY;

-- ── Políticas: profiles ───────────────────────────────────────────────────────

CREATE POLICY "usuario lee su propio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "usuario actualiza su propio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ── Políticas: service_categories (lectura pública) ───────────────────────────

CREATE POLICY "categorias son publicas"
  ON service_categories FOR SELECT
  USING (true);

-- ── Políticas: acompanantes ───────────────────────────────────────────────────

-- Fichas activas son públicas (el directorio)
CREATE POLICY "fichas activas son publicas"
  ON acompanantes FOR SELECT
  USING (activo = true);

-- El propio acompañante ve y edita su ficha
CREATE POLICY "acompanante ve su ficha"
  ON acompanantes FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "acompanante edita su ficha"
  ON acompanantes FOR UPDATE
  USING (profile_id = auth.uid());

-- ── Políticas: servicios ──────────────────────────────────────────────────────

-- Servicios activos de acompañantes activos son públicos
CREATE POLICY "servicios activos son publicos"
  ON servicios FOR SELECT
  USING (
    activo = true
    AND EXISTS (
      SELECT 1 FROM acompanantes
      WHERE id = servicios.acompanante_id AND activo = true
    )
  );

CREATE POLICY "acompanante gestiona sus servicios"
  ON servicios FOR ALL
  USING (acompanante_id = mi_acompanante_id());

-- ── Políticas: paquetes_clases ────────────────────────────────────────────────

CREATE POLICY "paquetes activos son publicos"
  ON paquetes_clases FOR SELECT
  USING (
    activo = true
    AND EXISTS (
      SELECT 1 FROM servicios s
      JOIN acompanantes a ON a.id = s.acompanante_id
      WHERE s.id = paquetes_clases.servicio_id AND s.activo = true AND a.activo = true
    )
  );

CREATE POLICY "acompanante gestiona sus paquetes"
  ON paquetes_clases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM servicios
      WHERE id = paquetes_clases.servicio_id
        AND acompanante_id = mi_acompanante_id()
    )
  );

-- ── Políticas: disponibilidad ─────────────────────────────────────────────────

CREATE POLICY "disponibilidad abierta es publica"
  ON disponibilidad FOR SELECT
  USING (estado = 'abierto');

CREATE POLICY "acompanante gestiona su disponibilidad"
  ON disponibilidad FOR ALL
  USING (acompanante_id = mi_acompanante_id());

-- ── Políticas: reservas ───────────────────────────────────────────────────────

CREATE POLICY "cliente ve sus reservas"
  ON reservas FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "cliente crea reservas"
  ON reservas FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "acompanante ve sus reservas"
  ON reservas FOR SELECT
  USING (acompanante_id = mi_acompanante_id());

CREATE POLICY "acompanante actualiza sus reservas"
  ON reservas FOR UPDATE
  USING (acompanante_id = mi_acompanante_id());

-- ── Políticas: solicitudes ────────────────────────────────────────────────────

CREATE POLICY "cliente ve sus solicitudes"
  ON solicitudes FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "cliente crea solicitudes"
  ON solicitudes FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "acompanante ve sus solicitudes"
  ON solicitudes FOR SELECT
  USING (acompanante_id = mi_acompanante_id());

CREATE POLICY "acompanante actualiza sus solicitudes"
  ON solicitudes FOR UPDATE
  USING (acompanante_id = mi_acompanante_id());

-- ── Políticas: resenas ────────────────────────────────────────────────────────

CREATE POLICY "resenas aprobadas son publicas"
  ON resenas FOR SELECT
  USING (aprobada = true);

CREATE POLICY "cliente crea resena"
  ON resenas FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "cliente ve su resena"
  ON resenas FOR SELECT
  USING (cliente_id = auth.uid());

-- ── Políticas: mensajes ───────────────────────────────────────────────────────

CREATE POLICY "usuario ve sus mensajes"
  ON mensajes FOR SELECT
  USING (emisor_id = auth.uid() OR receptor_id = auth.uid());

CREATE POLICY "usuario envia mensajes"
  ON mensajes FOR INSERT
  WITH CHECK (emisor_id = auth.uid());

CREATE POLICY "usuario marca como leido"
  ON mensajes FOR UPDATE
  USING (receptor_id = auth.uid());

-- ── Políticas: anunciantes ────────────────────────────────────────────────────

CREATE POLICY "anunciantes activos son publicos"
  ON anunciantes FOR SELECT
  USING (activo = true);

CREATE POLICY "anunciante ve su ficha"
  ON anunciantes FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "anunciante edita su ficha"
  ON anunciantes FOR UPDATE
  USING (profile_id = auth.uid());
