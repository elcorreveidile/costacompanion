import { redirect } from 'next/navigation';
import Link from 'next/link';
import { and, count, desc, eq, gt, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acompanantes, reservas } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { formatEuros } from '@/lib/precios';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import type { EstadoReserva } from '@/types/supabase';
import AnaliticasGraficas from './AnaliticasGraficas';

export const dynamic = 'force-dynamic';

const MESES = 6;

const ESTADOS: EstadoReserva[] = ['pendiente', 'confirmada', 'completada', 'rechazada', 'cancelada'];

const ESTADO_COLOR: Record<EstadoReserva, { bg: string; color: string }> = {
  pendiente: { bg: 'var(--terra-soft)', color: 'var(--terra)' },
  confirmada: { bg: 'rgba(74,111,80,0.12)', color: 'var(--green)' },
  rechazada: { bg: 'rgba(180,60,50,0.1)', color: '#b43c32' },
  cancelada: { bg: 'rgba(43,39,36,0.08)', color: 'rgba(43,39,36,0.5)' },
  completada: { bg: 'rgba(34,70,40,0.12)', color: 'var(--green-deep)' },
};

/** Claves «YYYY-MM» de los últimos MESES meses (mes actual incluido), UTC. */
function clavesMeses(): string[] {
  const hoy = new Date();
  const claves: string[] = [];
  for (let i = MESES - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
    claves.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return claves;
}

export default async function AdminAnaliticasPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  if (user.rol !== 'superadmin') redirect('/');

  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin.analiticas;
  const admin = dict.panelAdmin;
  const estadosTxt = dict.panelAcompanante.reservas.estados;

  const hoy = new Date();
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - (MESES - 1), 1));
  const soloGestiones = eq(reservas.tipoReserva, 'gestion');
  const cobrado = inArray(reservas.estadoPago, ['pagada', 'cobrada']);
  // Ingresos netos: precio del snapshot menos lo ya reembolsado.
  const netoExpr = sql<number>`coalesce(sum(${reservas.precioTotalCents} - ${reservas.reembolsoCents}), 0)::int`;

  const [porEstadoRows, cobrosRows, reembolsadoRows, serieReservasRows, serieIngresosRows, topRows] =
    await Promise.all([
      db
        .select({ estado: reservas.estado, n: count() })
        .from(reservas)
        .where(soloGestiones)
        .groupBy(reservas.estado),
      db
        .select({ metodoPago: reservas.metodoPago, n: count(), importe: netoExpr })
        .from(reservas)
        .where(and(soloGestiones, cobrado))
        .groupBy(reservas.metodoPago),
      db
        .select({ total: sql<number>`coalesce(sum(${reservas.reembolsoCents}), 0)::int` })
        .from(reservas)
        .where(and(soloGestiones, gt(reservas.reembolsoCents, 0))),
      db
        .select({
          mes: sql<string>`to_char(date_trunc('month', ${reservas.createdAt}), 'YYYY-MM')`,
          n: count(),
        })
        .from(reservas)
        .where(and(soloGestiones, gte(reservas.createdAt, desde)))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      db
        .select({
          mes: sql<string>`to_char(date_trunc('month', ${reservas.fechaHora}), 'YYYY-MM')`,
          importe: netoExpr,
        })
        .from(reservas)
        .where(and(soloGestiones, cobrado, gte(reservas.fechaHora, desde)))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      db
        .select({
          slug: acompanantes.slug,
          nombre: acompanantes.nombrePublico,
          n: count(),
          importe: sql<number>`coalesce(sum(case when ${reservas.estadoPago} in ('pagada', 'cobrada') then ${reservas.precioTotalCents} - ${reservas.reembolsoCents} else 0 end), 0)::int`,
        })
        .from(reservas)
        .innerJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
        .where(soloGestiones)
        .groupBy(acompanantes.id, acompanantes.slug, acompanantes.nombrePublico)
        .orderBy(desc(count()))
        .limit(5),
    ]);

  // KPIs globales (todo el histórico de gestiones).
  const totalReservas = porEstadoRows.reduce((acc, r) => acc + r.n, 0);
  const completadas = porEstadoRows.find((r) => r.estado === 'completada')?.n ?? 0;
  const cobradas = cobrosRows.reduce((acc, r) => acc + r.n, 0);
  const ingresosNetos = cobrosRows.reduce((acc, r) => acc + r.importe, 0);
  const ticketMedio = cobradas > 0 ? Math.round(ingresosNetos / cobradas) : 0;
  const reembolsado = reembolsadoRows[0]?.total ?? 0;

  // Series mensuales con meses vacíos rellenos a 0.
  const meses = clavesMeses();
  const reservasPorMes = new Map(serieReservasRows.map((r) => [r.mes, r.n]));
  const ingresosPorMes = new Map(serieIngresosRows.map((r) => [r.mes, r.importe]));
  const serieReservas = meses.map((mes) => ({ mes, valor: reservasPorMes.get(mes) ?? 0 }));
  const serieIngresos = meses.map((mes) => ({ mes, valor: ingresosPorMes.get(mes) ?? 0 }));

  const mapaEstado = new Map(porEstadoRows.map((r) => [r.estado, r.n]));
  const porMetodo = new Map(cobrosRows.map((r) => [r.metodoPago, r]));

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-(--ink)/50 space-x-2">
          <a href={localePath(locale, '/admin')} className="hover:text-(--ink) transition-colors">
            {admin.shared.admin}
          </a>
          <span>›</span>
          <span className="text-(--ink)/80">{t.h1}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-(--green) mb-1">{t.h1}</h1>
        <p className="text-sm text-(--ink)/60 mb-8">{t.desc}</p>

        {totalReservas === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <p className="text-(--ink)/40">{t.sinDatos}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: t.kpiReservas, valor: String(totalReservas) },
                { label: t.kpiCompletadas, valor: String(completadas) },
                { label: t.kpiIngresos, valor: formatEuros(ingresosNetos, locale) },
                { label: t.kpiTicket, valor: formatEuros(ticketMedio, locale) },
                { label: t.kpiReembolsado, valor: formatEuros(reembolsado, locale) },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl border p-4"
                  style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
                >
                  <p className="text-xs text-(--ink)/50 leading-snug">{kpi.label}</p>
                  <p className="font-display text-xl font-semibold text-(--green) mt-1">{kpi.valor}</p>
                </div>
              ))}
            </div>

            {/* Gráficos: reservas creadas e ingresos cobrados por mes */}
            <AnaliticasGraficas
              serieReservas={serieReservas}
              serieIngresos={serieIngresos}
              locale={locale}
              labelReservas={t.serieReservas}
              labelIngresos={t.serieIngresos}
              labelEvolucion={t.evolucion}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Por estado */}
              <div
                className="rounded-xl border p-5"
                style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
              >
                <h3 className="font-display text-base font-medium text-(--green) mb-3">{t.porEstado}</h3>
                <ul className="space-y-2">
                  {ESTADOS.map((estado) => {
                    const n = mapaEstado.get(estado) ?? 0;
                    const c = ESTADO_COLOR[estado];
                    return (
                      <li key={estado} className="flex items-center justify-between gap-3 text-sm">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${n === 0 ? 'opacity-40' : ''}`}
                          style={{ background: c.bg, color: c.color }}
                        >
                          {estadosTxt[estado] ?? estado}
                        </span>
                        <span className="font-medium text-(--ink)">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Por método de pago (solo cobrado) */}
              <div
                className="rounded-xl border p-5"
                style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
              >
                <h3 className="font-display text-base font-medium text-(--green) mb-1">{t.porMetodo}</h3>
                <p className="text-xs text-(--ink)/40 mb-3">{t.kpiIngresos}</p>
                <ul className="space-y-2">
                  {(['tarjeta', 'efectivo'] as const).map((metodo) => {
                    const fila = porMetodo.get(metodo);
                    return (
                      <li
                        key={metodo}
                        className={`flex items-center justify-between gap-3 text-sm ${!fila ? 'opacity-40' : ''}`}
                      >
                        <span className="text-(--ink)/70">{metodo === 'tarjeta' ? t.tarjeta : t.efectivo}</span>
                        <span className="font-medium text-(--ink)">
                          {fila ? `${fila.n} · ${formatEuros(fila.importe, locale)}` : '0'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Top acompañantes */}
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <h3 className="font-display text-base font-medium text-(--green) mb-3">{t.topTitulo}</h3>
              <ul className="space-y-2">
                {topRows.map((r, i) => (
                  <li
                    key={r.slug}
                    className="flex items-center justify-between gap-3 text-sm rounded-lg bg-(--bone) px-3 py-2"
                  >
                    <span className="min-w-0 flex items-center gap-2">
                      <span className="text-(--ink)/35 font-medium w-5 shrink-0">{i + 1}.</span>
                      <Link
                        href={localePath(locale, `/${r.slug}`)}
                        className="truncate font-medium text-(--ink) hover:text-(--terra) transition-colors"
                      >
                        {r.nombre}
                      </Link>
                    </span>
                    <span className="shrink-0 text-(--ink)/60">
                      {r.n} {t.thReservas.toLowerCase()} · {formatEuros(r.importe, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
