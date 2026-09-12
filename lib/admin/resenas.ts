'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { resenas } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { recalcularValoracion } from '@/lib/resenas/helpers';

export async function toggleAprobada(id: string, aprobada: boolean): Promise<void> {
  const user = await getSessionUser();
  if (user?.rol !== 'superadmin') return;

  const [row] = await db
    .update(resenas)
    .set({ aprobada })
    .where(eq(resenas.id, id))
    .returning({ acompananteId: resenas.acompananteId });

  if (row?.acompananteId) await recalcularValoracion(row.acompananteId);

  revalidatePath('/admin/resenas');
}
