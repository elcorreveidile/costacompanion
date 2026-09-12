'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  /** Compatibilidad con el uso previo; ya no se usan (antes filtraban el canal realtime). */
  table?: string;
  filter?: string;
  /** Intervalo de sondeo en ms (por defecto 12s). */
  intervalMs?: number;
}

/**
 * Refresca el Server Component padre por SONDEO (polling), sustituyendo al
 * realtime de Supabase. Llama a router.refresh() cada `intervalMs` mientras la
 * pestaña está visible, para que los datos se actualicen sin recargar la página.
 */
export function RealtimeRefresher({ intervalMs = 12000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
