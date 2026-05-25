import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Supabase Admin client — usa service_role, bypasa RLS.
 *
 * IMPORTANTE: Este módulo importa SUPABASE_SERVICE_ROLE_KEY, una clave secreta
 * que NUNCA debe llegar al bundle del cliente. Usar ÚNICAMENTE en:
 *   - Server Actions ('use server')
 *   - Route Handlers (app/api/...)
 *   - Scripts de migración / seed
 *
 * Si ves este cliente importado en un archivo sin 'use server' o sin
 * estar en app/api, es un error de seguridad.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias para el cliente admin."
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
