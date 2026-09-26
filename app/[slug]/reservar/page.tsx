import { notFound, redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profiles, reservas, tiposGestion, zonas } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getAcompananteActivoBySlug } from '@/lib/db/queries/public';
import { getServiciosPublicos, getDisponibilidadFutura } from '@/lib/db/queries/ficha';
import { getI18n } from '@/lib/i18n/server';
import { languageName, localePath, locales } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';
import type { ModoGestion } from '@/lib/precios';
import { ReservarFormClient } from './ReservarFormClient';
import { ReservarGestionForm } from './ReservarGestionForm';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; desde?: string }>;
}

export default async function ReservarPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tipo, desde } = await searchParams;

  const { locale, dict } = await getI18n();

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, `/auth/login?redirect=/${slug}/reservar`));

  const acompanante = await getAcompananteActivoBySlug(slug);
  if (!acompanante) notFound();

  // Gestiones = flujo nuevo por defecto (tarjeta de precios de la plataforma);
  // ?tipo=clase conserva el flujo de clases intacto.
  if (acompanante.acepta_gestiones && tipo !== 'clase') {
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

    const mods = acompanante.modalidades;
    const modosDisponibles: ModoGestion[] = [];
    if (mods.length === 0 || mods.includes('remoto') || mods.includes('ambos')) {
      modosDisponibles.push('remota');
    }
    if (mods.length === 0 || mods.includes('presencial') || mods.includes('ambos')) {
      modosDisponibles.push('horas', 'media_jornada', 'jornada');
    }

    // Re-reservar (?desde={id}): precarga modo/tipo/idioma/zona de UNA gestión
    // propia. Nunca precarga fecha ni importe — se recalculan desde cero.
    let precarga: {
      modo: ModoGestion;
      tipoKey: string | null;
      idioma: string | null;
      zonaKey: string | null;
    } | null = null;
    if (desde) {
      const [prev] = await db
        .select({
          clienteId: reservas.clienteId,
          tipoReserva: reservas.tipoReserva,
          modoGestion: reservas.modoGestion,
          tipoGestionKey: reservas.tipoGestionKey,
          idiomaGestion: reservas.idiomaGestion,
          zona: reservas.zona,
        })
        .from(reservas)
        .where(eq(reservas.id, desde))
        .limit(1);
      if (
        prev &&
        prev.clienteId === user.id &&
        prev.tipoReserva === 'gestion' &&
        prev.modoGestion &&
        modosDisponibles.includes(prev.modoGestion)
      ) {
        precarga = {
          modo: prev.modoGestion,
          tipoKey: prev.tipoGestionKey,
          idioma: prev.idiomaGestion,
          zonaKey: prev.zona,
        };
      }
    }

    return (
      <ReservarGestionForm
        slug={slug}
        locale={locale}
        t={dict.flujos.gestiones}
        acompananteId={acompanante.id}
        nombrePublico={acompanante.nombre_publico}
        modosDisponibles={modosDisponibles}
        efectivoBloqueado={profileRow[0]?.efectivoBloqueado ?? false}
        precarga={precarga}
        zonas={zonasRows.map((z) => ({
          key: z.key,
          nombre: pickLang(z.nombre as Record<string, unknown> | null, locale) || z.key,
        }))}
        tiposGestion={tiposRows.map((tg) => ({
          key: tg.key,
          nombre: pickLang(tg.nombre as Record<string, unknown> | null, locale) || tg.key,
        }))}
        zonaBaseKey={acompanante.zona_base}
        idiomas={locales.map((l) => ({ code: l, nombre: languageName(l, locale) }))}
      />
    );
  }

  const serviciosFull = await getServiciosPublicos(acompanante.id);
  const servicios = serviciosFull.map((s) => ({
    id: s.id,
    titulo: pickLang(s.titulo as Record<string, unknown> | null, locale) || dict.flujos.reservar.servicio,
    precio: s.precio,
    unidad_precio: s.unidad_precio,
  }));

  const disponibilidades = await getDisponibilidadFutura(acompanante.id);

  return (
    <ReservarFormClient
      slug={slug}
      locale={locale}
      t={dict.flujos}
      modalidades={dict.common.modalidades}
      acompananteId={acompanante.id}
      nombrePublico={acompanante.nombre_publico}
      servicios={servicios}
      disponibilidades={disponibilidades}
      tabGestionHref={
        acompanante.acepta_gestiones ? localePath(locale, `/${slug}/reservar`) : null
      }
      tabGestionLabel={dict.flujos.gestiones.tabGestion}
    />
  );
}
