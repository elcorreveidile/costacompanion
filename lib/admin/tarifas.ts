'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tarifas, zonas, configPrecios } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';

/**
 * Edición de la tarjeta de precios (solo superadmin).
 * Los importes viajan ya en céntimos (el cliente convierte de euros).
 */

export type ResultadoGuardado = { ok: boolean; error?: string };

async function assertSuperadmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.rol === 'superadmin';
}

export async function guardarImporteTarifa(key: string, importeCents: number): Promise<ResultadoGuardado> {
  if (!Number.isInteger(importeCents) || importeCents <= 0) {
    return { ok: false, error: 'importe_invalido' };
  }
  if (!(await assertSuperadmin())) return { ok: false, error: 'no_autorizado' };

  await db.update(tarifas).set({ importeCents }).where(eq(tarifas.key, key));
  revalidatePath('/admin/tarifas');
  return { ok: true };
}

export async function guardarRecargoZona(key: string, recargoCents: number): Promise<ResultadoGuardado> {
  if (!Number.isInteger(recargoCents) || recargoCents < 0) {
    return { ok: false, error: 'importe_invalido' };
  }
  if (!(await assertSuperadmin())) return { ok: false, error: 'no_autorizado' };

  await db.update(zonas).set({ recargoCents }).where(eq(zonas.key, key));
  revalidatePath('/admin/tarifas');
  return { ok: true };
}

export async function guardarConfigPrecio(clave: string, valorEntero: number): Promise<ResultadoGuardado> {
  if (!Number.isInteger(valorEntero) || valorEntero < 0) {
    return { ok: false, error: 'valor_invalido' };
  }
  if (!(await assertSuperadmin())) return { ok: false, error: 'no_autorizado' };

  await db.update(configPrecios).set({ valorEntero }).where(eq(configPrecios.clave, clave));
  revalidatePath('/admin/tarifas');
  return { ok: true };
}
