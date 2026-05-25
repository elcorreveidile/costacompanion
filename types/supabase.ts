/**
 * Tipos generados del esquema de Supabase.
 *
 * En desarrollo: ejecuta `supabase gen types typescript --linked > types/supabase.ts`
 * para sobreescribir con los tipos reales del proyecto conectado.
 *
 * Este archivo es el esqueleto de referencia para la Fase 0.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MultilingualText = {
  es?: string;
  en?: string;
  fr?: string;
  de?: string;
  nl?: string;
};

export type Rol = "cliente" | "acompanante" | "anunciante" | "superadmin";
export type Modalidad = "presencial" | "remoto" | "ambos";
export type EstadoReserva =
  | "pendiente"
  | "confirmada"
  | "rechazada"
  | "cancelada"
  | "completada";
export type EstadoSolicitud = "pendiente" | "aceptada" | "rechazada";
export type EstadoDisponibilidad = "abierto" | "cerrado";
export type UnidadPrecio = "hora" | "servicio" | "sesion";
export type GrupoCategoria = "tramites" | "salud" | "propiedad" | "otros";
export type CategoriaAnunciante =
  | "inmobiliaria"
  | "salud"
  | "legal"
  | "restauracion"
  | "comercio"
  | "otros";
export type PlanAnunciante = "basico" | "destacado";
export type EstadoStripe =
  | "sin_suscripcion"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

// ── Tablas ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  rol: Rol;
  nombre: string | null;
  telefono: string | null;
  idioma_preferido: "es" | "en" | "fr" | "de" | "nl" | null;
  created_at: string;
}

export interface Acompanante {
  id: string;
  profile_id: string;
  slug: string;
  nombre_publico: string;
  foto_url: string | null;
  bio: MultilingualText | null;
  idiomas: string[];
  zonas: string[];
  modalidades: Modalidad[];
  email_contacto: string | null;
  whatsapp: string | null;
  titulacion: string | null;
  interprete_jurado: boolean;
  anios_experiencia: number | null;
  imparte_clases: boolean;
  valoracion_media: number | null;
  num_resenas: number;
  activo: boolean;
  destacado: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: EstadoStripe;
  created_at: string;
}

export interface Servicio {
  id: string;
  acompanante_id: string;
  categoria: string;
  titulo: MultilingualText;
  descripcion: MultilingualText | null;
  modalidad: Modalidad;
  precio: number;
  unidad_precio: UnidadPrecio;
  es_clase: boolean;
  activo: boolean;
  created_at: string;
}

export interface PaqueteClases {
  id: string;
  servicio_id: string;
  num_sesiones: number;
  precio_total: number;
  activo: boolean;
}

export interface ServiceCategory {
  id: string;
  key: string;
  grupo: GrupoCategoria;
  nombre: MultilingualText;
  created_at: string;
}

export interface Disponibilidad {
  id: string;
  acompanante_id: string;
  fecha_hora: string;
  duracion_min: number;
  modalidad: Modalidad;
  zona: string | null;
  estado: EstadoDisponibilidad;
  created_at: string;
}

export interface Reserva {
  id: string;
  acompanante_id: string;
  cliente_id: string;
  servicio_id: string | null;
  disponibilidad_id: string | null;
  fecha_hora: string;
  modalidad: Modalidad;
  zona: string | null;
  detalle_servicio: string | null;
  estado: EstadoReserva;
  created_at: string;
  cancelada_at: string | null;
}

export interface Solicitud {
  id: string;
  acompanante_id: string;
  cliente_id: string;
  descripcion: string;
  detalle_servicio: string | null;
  fecha_hora_deseada: string | null;
  modalidad: Modalidad;
  zona: string | null;
  precio_propuesto: number | null;
  estado: EstadoSolicitud;
  created_at: string;
}

export interface Resena {
  id: string;
  acompanante_id: string;
  cliente_id: string;
  reserva_id: string | null;
  puntuacion: number;
  comentario: string | null;
  aprobada: boolean;
  created_at: string;
}

export interface Mensaje {
  id: string;
  reserva_id: string | null;
  solicitud_id: string | null;
  emisor_id: string;
  receptor_id: string;
  texto: string;
  leido: boolean;
  created_at: string;
}

export interface Anunciante {
  id: string;
  profile_id: string | null;
  nombre_negocio: string;
  slug: string;
  categoria: CategoriaAnunciante;
  descripcion: MultilingualText | null;
  logo_url: string | null;
  web: string | null;
  telefono: string | null;
  email: string | null;
  whatsapp: string | null;
  zona: string | null;
  plan: PlanAnunciante;
  activo: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: EstadoStripe;
  created_at: string;
}

// ── Database helper type ─────────────────────────────────────────────────────
// Se expande en fases posteriores con el tipo completo generado por Supabase CLI.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      acompanantes: { Row: Acompanante; Insert: Partial<Acompanante>; Update: Partial<Acompanante> };
      servicios: { Row: Servicio; Insert: Partial<Servicio>; Update: Partial<Servicio> };
      paquetes_clases: { Row: PaqueteClases; Insert: Partial<PaqueteClases>; Update: Partial<PaqueteClases> };
      service_categories: { Row: ServiceCategory; Insert: Partial<ServiceCategory>; Update: Partial<ServiceCategory> };
      disponibilidad: { Row: Disponibilidad; Insert: Partial<Disponibilidad>; Update: Partial<Disponibilidad> };
      reservas: { Row: Reserva; Insert: Partial<Reserva>; Update: Partial<Reserva> };
      solicitudes: { Row: Solicitud; Insert: Partial<Solicitud>; Update: Partial<Solicitud> };
      resenas: { Row: Resena; Insert: Partial<Resena>; Update: Partial<Resena> };
      mensajes: { Row: Mensaje; Insert: Partial<Mensaje>; Update: Partial<Mensaje> };
      anunciantes: { Row: Anunciante; Insert: Partial<Anunciante>; Update: Partial<Anunciante> };
    };
    Views: Record<string, never>;
    Functions: {
      mi_acompanante_id: { Args: Record<string, never>; Returns: string | null };
      es_acompanante_activo: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
