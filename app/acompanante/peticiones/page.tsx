import { redirect } from 'next/navigation';
import Link from 'next/link';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  acompanantes,
  profiles,
  reservas,
  tiposGestion,
  zonas as tZonas,
} from '@/lib/db/schema';
import { aceptarPeticion, liberarPeticion } from '@/lib/reservas/cola';
import { getSessionUser } from '@/lib/auth/session';
import { getMiAcompananteId } from '@/lib/db/queries/acompanante';
import { formatEuros, modalidadCompatible } from '@/lib/precios';
import { fechaHoraMadrid } from '@/lib/tiempo';
import { getI18n } from '@/lib/i18n/server';
import { languageName, localePath } from '@/lib/i18n/config';
import { pickLang } from '@/lib/i18n/pick';

export const metadata = { title: 'Peticiones de gestión | Costa Companion' };

/**
 * Autoservicio de cola (C1.5): peticiones sin asignar compatibles con las
 * modalidades del acompañante + las que él mismo aceptó y siguen pre-pago.
 * La cola se lee aquí mismo (sin email del cliente en el SELECT).
 */
export default async function AcompanantePeticionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error_precio?: string }>;
}) {
  const { locale, dict } = await getI18n();
  const t = dict.panelAcompanante;
  const pt = t.peticiones;

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  const acompananteId = await getMiAcompananteId(user.id);
  if (!acompananteId) redirect(localePath(locale, '/acompanante'));

  const [ficha] = await db
    .select({
      activo: acompanantes.activo,
      aceptaGestiones: acompanantes.aceptaGestiones,
      modalidades: acompanantes.modalidades,
    })
    .from(acompanantes)
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);
  if (!ficha || !ficha.activo || !ficha.aceptaGestiones) {
    redirect(localePath(locale, '/acompanante'));
  }

  const { error_precio } = await searchParams;

  // Cola: NUNCA se selecciona el email ni el teléfono del cliente.
  const colaRows = await db
    .select({
      id: reservas.id,
      fechaHora: reservas.fechaHora,
      modoGestion: reservas.modoGestion,
      horas: reservas.horas,
      tipoGestionKey: reservas.tipoGestionKey,
      idiomaGestion: reservas.idiomaGestion,
      zona: reservas.zona,
      detalleServicio: reservas.detalleServicio,
      metodoPago: reservas.metodoPago,
      clienteNombre: profiles.nombre,
    })
    .from(reservas)
    .leftJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(
      and(
        isNull(reservas.acompananteId),
        eq(reservas.tipoReserva, 'gestion'),
        eq(reservas.estado, 'pendiente')
      )
    )
    .orderBy(asc(reservas.createdAt))
    .limit(50);

  const cola = colaRows.filter(
    (p) => !!p.modoGestion && modalidadCompatible(ficha.modalidades, p.modoGestion)
  );

  // Aceptadas por mí, aún pre-pago (liberables).
  const aceptadas = await db
    .select({
      id: reservas.id,
      fechaHora: reservas.fechaHora,
      modoGestion: reservas.modoGestion,
      horas: reservas.horas,
      tipoGestionKey: reservas.tipoGestionKey,
      idiomaGestion: reservas.idiomaGestion,
      zona: reservas.zona,
      detalleServicio: reservas.detalleServicio,
      metodoPago: reservas.metodoPago,
      clienteNombre: profiles.nombre,
      precioTotalCents: reservas.precioTotalCents,
      estadoPago: reservas.estadoPago,
    })
    .from(reservas)
    .leftJoin(profiles, eq(profiles.id, reservas.clienteId))
    .where(
      and(
        eq(reservas.acompananteId, acompananteId),
        eq(reservas.tipoReserva, 'gestion'),
        eq(reservas.estado, 'pendiente'),
        inArray(reservas.estadoPago, ['pendiente_pago', 'pendiente_cobro']),
        isNull(reservas.stripePaymentIntentId)
      )
    )
    .orderBy(asc(reservas.asignadoAt))
    .limit(50);

  const [zonasRows, tiposRows] = await Promise.all([
    db.select({ key: tZonas.key, nombre: tZonas.nombre }).from(tZonas),
    db
      .select({ key: tiposGestion.key, nombre: tiposGestion.nombre })
      .from(tiposGestion)
      .where(eq(tiposGestion.activo, true)),
  ]);
  const nombreDe = (
    rows: { key: string; nombre: unknown }[],
    key: string | null
  ): string | null => {
    if (!key) return null;
    const row = rows.find((r) => r.key === key);
    return row
      ? pickLang(row.nombre as Record<string, unknown> | null, locale) || key
      : key;
  };

  const modos = dict.panelCliente.reservas.modos as Record<string, string>;
  const metodos = dict.panelCliente.detalle.metodos as Record<string, string>;
  const estadosPago = dict.panelCliente.reservas.estadosPago as Record<string, string>;

  type PeticionBase = (typeof colaRows)[number];
  const metaDe = (p: PeticionBase): string[] => {
    const partes: string[] = [];
    if (p.modoGestion) partes.push(modos[p.modoGestion] ?? p.modoGestion);
    const tipo = nombreDe(tiposRows, p.tipoGestionKey);
    if (tipo) partes.push(tipo);
    if (p.idiomaGestion) partes.push(languageName(p.idiomaGestion, locale));
    const zona = nombreDe(zonasRows, p.zona);
    if (zona) partes.push(zona);
    if (p.modoGestion === 'horas' && p.horas) {
      partes.push(`${p.horas} ${pt.horasLabel}`);
    }
    if (p.metodoPago) partes.push(metodos[p.metodoPago] ?? p.metodoPago);
    partes.push(fechaHoraMadrid(p.fechaHora));
    return partes;
  };

  const cardBase =
    'rounded-xl border p-6 shadow-sm';
  const cardStyle = { background: 'var(--bone-2)', borderColor: 'var(--line)' };

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <Link
            href={localePath(locale, '/acompanante')}
            className="inline-flex items-center gap-1.5 text-sm text-(--ink)/60 hover:opacity-80 transition-opacity mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.shared.volverAlPanel}
          </Link>
          <h1 className="font-display text-3xl font-semibold text-(--green)">
            {pt.h1}
          </h1>
          <p className="text-(--ink)/70 mt-2 max-w-2xl">{pt.subtitulo}</p>
        </div>

        {error_precio && (
          <div
            className="rounded-lg border px-4 py-3 mb-6 text-sm"
            style={{
              background: 'var(--terra-soft)',
              borderColor: 'var(--terra)',
              color: 'var(--ink)',
            }}
          >
            {pt.errorPrecio}
          </div>
        )}

        {/* Sección 1: cola */}
        {cola.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center mb-10"
            style={cardStyle}
          >
            <p className="text-(--ink)/40 text-lg">{pt.vacioTitulo}</p>
            <p className="text-(--ink)/30 text-sm mt-2">{pt.vacioTexto}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {cola.map((p) => {
              const meta = metaDe(p);
              return (
                <div key={p.id} className={`${cardBase}`} style={cardStyle}>
                  <p className="font-display text-lg font-medium text-(--green)">
                    {p.clienteNombre ?? t.shared.cliente}
                  </p>
                  <p className="text-sm text-(--ink)/60 mt-1">{meta.join(' · ')}</p>
                  {p.detalleServicio && (
                    <p className="text-sm text-(--ink)/80 mt-2 leading-relaxed line-clamp-2">
                      {p.detalleServicio}
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                    <form action={aceptarPeticion}>
                      <input type="hidden" name="reserva_id" value={p.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button
                        type="submit"
                        className="text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--green)', color: 'var(--bone)' }}
                      >
                        {pt.aceptar}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sección 2: aceptadas por mí (pre-pago) */}
        <h2 className="font-display text-xl font-medium text-(--green) mb-4">
          {pt.aceptadasTitulo}
        </h2>
        {aceptadas.length === 0 ? (
          <div className="rounded-xl border p-6 text-center" style={cardStyle}>
            <p className="text-(--ink)/30 text-sm">{pt.aceptadasVacio}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aceptadas.map((p) => {
              const meta = metaDe(p);
              return (
                <div key={p.id} className={`${cardBase}`} style={cardStyle}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg font-medium text-(--green)">
                        {p.clienteNombre ?? t.shared.cliente}
                      </p>
                      <p className="text-sm text-(--ink)/60 mt-1">{meta.join(' · ')}</p>
                      {p.detalleServicio && (
                        <p className="text-sm text-(--ink)/80 mt-2 leading-relaxed line-clamp-2">
                          {p.detalleServicio}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ background: 'var(--terra-soft)', color: 'var(--terra)' }}
                      >
                        {estadosPago[p.estadoPago] ?? p.estadoPago}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: 'var(--line)' }}>
                    {p.precioTotalCents != null ? (
                      <p className="text-sm">
                        <span className="text-(--ink)/60">{pt.importePendiente}: </span>
                        <span className="font-medium text-(--green)">
                          {formatEuros(p.precioTotalCents, locale)}
                        </span>
                      </p>
                    ) : (
                      <span />
                    )}
                    <form action={liberarPeticion}>
                      <input type="hidden" name="reserva_id" value={p.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button
                        type="submit"
                        title={pt.liberarTitle}
                        className="text-sm font-medium px-4 py-2 rounded-lg border transition-opacity hover:opacity-70"
                        style={{ borderColor: 'var(--line)', color: 'rgba(43,39,36,0.6)', background: 'transparent' }}
                      >
                        {pt.liberar}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
