import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profiles, tiposGestion, zonas } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getI18n } from '@/lib/i18n/server';
import { languageName, localePath, locales } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';
import type { ModoGestion } from '@/lib/precios';
import { ReservarGestionForm } from '@/app/[slug]/reservar/ReservarGestionForm';

/**
 * Solicitud de gestión SIN acompañante (Fase C1): la petición entra en cola,
 * gratis hasta que el equipo la asigna y el cliente aprueba el precio final.
 * Ruta estática — gana sobre /[slug] (ningún acompañante puede tener slug
 * «reservar»). Usa el mismo formulario que /[slug]/reservar en modoCola.
 */
export default async function ReservarColaPage() {
  const { locale, dict } = await getI18n();

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login?redirect=/reservar'));

  const [zonasRows, tiposRows, profileRow] = await Promise.all([
    db.select().from(zonas).where(eq(zonas.activo, true)).orderBy(asc(zonas.orden)),
    db
      .select()
      .from(tiposGestion)
      .where(eq(tiposGestion.activo, true))
      .orderBy(asc(tiposGestion.orden)),
    db
      .select({ efectivoBloqueado: profiles.efectivoBloqueado })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1),
  ]);

  // Sin acompañante fijo se ofertan todos los modos; la compatibilidad con el
  // asignado se comprueba al asignar (lib/reservas/asignaciones.ts).
  const modosDisponibles: ModoGestion[] = ['remota', 'horas', 'media_jornada', 'jornada'];

  return (
    <ReservarGestionForm
      slug=""
      locale={locale}
      t={dict.flujos.gestiones}
      acompananteId=""
      nombrePublico=""
      modoCola
      modosDisponibles={modosDisponibles}
      efectivoBloqueado={profileRow[0]?.efectivoBloqueado ?? false}
      zonas={zonasRows.map((z) => ({
        key: z.key,
        nombre: pickLang(z.nombre as Record<string, unknown> | null, locale) || z.key,
      }))}
      tiposGestion={tiposRows.map((tg) => ({
        key: tg.key,
        nombre: pickLang(tg.nombre as Record<string, unknown> | null, locale) || tg.key,
      }))}
      zonaBaseKey={null}
      idiomas={locales.map((l) => ({ code: l, nombre: languageName(l, locale) }))}
    />
  );
}
