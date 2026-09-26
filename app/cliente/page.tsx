import { and, count, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { documentos, mensajes, profiles, zonas } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { ActivarPush } from "@/components/push/ActivarPush";
import { getProximaGestion } from "@/lib/db/queries/cliente";
import { videoEnVentana } from "@/lib/reservas/videollamada";
import { TZ_MADRID } from "@/lib/tiempo";
import { pickLang } from "@/lib/i18n/pick";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { getI18n } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/config";

export default async function ClienteDashboard() {
  const user = await getSessionUser();
  if (!user) return null;

  const { locale, dict } = await getI18n();
  const t = dict.panelCliente;

  const [profile] = await db
    .select({ nombre: profiles.nombre })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const nombre = profile?.nombre || user.email || '';

  // Aviso del dashboard: mensajes sin leer.
  const [noLeidos] = await db
    .select({ n: count() })
    .from(mensajes)
    .where(and(eq(mensajes.receptorId, user.id), eq(mensajes.leido, false)));

  // Mi próxima gestión (confirmada, futura, la más cercana) + sus documentos.
  const proxima = await getProximaGestion(user.id);
  const [docsProxima, zonaProxima] = proxima
    ? await Promise.all([
        db
          .select({ n: count() })
          .from(documentos)
          .where(and(eq(documentos.reservaId, proxima.id), isNull(documentos.eliminadoAt))),
        proxima.zona
          ? db
              .select({ nombre: zonas.nombre })
              .from(zonas)
              .where(eq(zonas.key, proxima.zona))
              .limit(1)
          : Promise.resolve([]),
      ])
    : [[{ n: 0 }], []];
  const zonaNombre = proxima?.zona
    ? pickLang(zonaProxima[0]?.nombre as Record<string, unknown> | null, locale) || proxima.zona
    : null;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <RealtimeRefresher />
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            {t.dashboard.bienvenido.replace('{nombre}', String(nombre ?? ''))}
          </h1>
          <p className="text-lg text-(--ink)/70">
            {t.dashboard.areaCliente}
          </p>
        </div>

        {/* Mi próxima gestión */}
        {proxima && (
          <div
            className="rounded-xl border p-6 shadow-sm mb-8"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--green)' }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-(--green) mb-1">
                  {t.dashboard.proximaTitulo}
                </p>
                <p className="font-display text-lg font-medium text-(--ink)">
                  {new Intl.DateTimeFormat(locale, {
                    timeZone: TZ_MADRID,
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(proxima.fecha_hora))}
                </p>
                <p className="text-sm text-(--ink)/60 mt-1">
                  {proxima.acompanantes?.nombre_publico}
                  {zonaNombre ? ` · ${zonaNombre}` : ''}
                  {docsProxima[0]?.n ? ` · ${t.dashboard.proximaDocs}: ${docsProxima[0].n}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Link
                  href={localePath(locale, `/cliente/reservas/${proxima.id}`)}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--green)', color: 'var(--bone)' }}
                >
                  {t.reservas.verDetalle}
                </Link>
                {proxima.enlace_video && videoEnVentana(new Date(proxima.fecha_hora)) && (
                  <a
                    href={proxima.enlace_video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
                    style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                  >
                    {t.detalle.enlaceVideo}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cards de navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href={localePath(locale, "/cliente/reservas")}
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--green)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              {t.dashboard.cardReservasTitulo}
            </h3>
            <p className="text-sm text-(--ink)/60">
              {t.dashboard.cardReservasDesc}
            </p>
          </Link>

          <Link
            href={localePath(locale, "/cliente/solicitudes")}
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--terra)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              {t.dashboard.cardSolicitudesTitulo}
            </h3>
            <p className="text-sm text-(--ink)/60">
              {t.dashboard.cardSolicitudesDesc}
            </p>
          </Link>

          <Link
            href={localePath(locale, "/cliente/mensajes")}
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--terra)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1 flex items-center gap-2 flex-wrap">
              {t.dashboard.cardMensajesTitulo}
              {(noLeidos?.n ?? 0) > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(201,123,74,0.12)', color: 'var(--terra)' }}
                  title={t.dashboard.badgeMensajes}
                  aria-label={`${noLeidos?.n} ${t.dashboard.badgeMensajes}`}
                >
                  {noLeidos?.n}
                </span>
              )}
            </h3>
            <p className="text-sm text-(--ink)/60">
              {t.dashboard.cardMensajesDesc}
            </p>
          </Link>

          <Link
            href={localePath(locale, "/directorio")}
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--green-deep)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              {t.dashboard.cardDirectorioTitulo}
            </h3>
            <p className="text-sm text-(--ink)/60">
              {t.dashboard.cardDirectorioDesc}
            </p>
          </Link>
        </div>

        {/* Información de cuenta */}
        <div className="bg-(--bone-2) rounded-lg p-6 shadow-sm border border-(--line) mb-4">
          <h3 className="font-medium text-(--green) mb-2">{t.dashboard.cuentaTitulo}</h3>
          <div className="text-sm text-(--ink)/70 space-y-1">
            <p>{t.shared.email}: {user.email}</p>{/* sesión Auth.js */}
            <p>{t.shared.rol}: {t.shared.cliente}</p>
            {profile?.nombre && <p>{t.shared.nombre}: {profile.nombre}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <ActivarPush
            labels={{
              activar: dict.notificaciones.activar,
              activadas: dict.notificaciones.activadas,
              error: dict.notificaciones.error,
            }}
          />
          <Link
            href={localePath(locale, "/profile")}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
          >
            {t.shared.verPerfil}
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border font-medium text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
            >
              {t.shared.cerrarSesion}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
