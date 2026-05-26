'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  table: string;
  filter: string; // e.g. "cliente_id=eq.uuid" or "acompanante_id=eq.uuid"
}

/**
 * Escucha cambios en `table` filtrados por `filter` y llama a router.refresh()
 * para que el Server Component padre recargue los datos sin recargar la página.
 */
export function RealtimeRefresher({ table, filter }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-${table}-${filter}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => router.refresh()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, table, filter]);

  return null;
}
