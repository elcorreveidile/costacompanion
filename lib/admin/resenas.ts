'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

type RawClient = SupabaseClient;

export async function toggleAprobada(id: string, aprobada: boolean): Promise<void> {
  const admin = createAdminClient();
  await (admin as RawClient).from('resenas').update({ aprobada }).eq('id', id);
  revalidatePath('/admin/resenas');
}
