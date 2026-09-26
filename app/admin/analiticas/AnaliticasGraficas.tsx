'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type SeriePunto = { mes: string; valor: number };

const VERDE = '#2C4A3B';
const TERRA = '#E0A877';
const EJE = 'rgba(43,39,36,0.5)';

export default function AnaliticasGraficas({
  serieReservas,
  serieIngresos,
  locale,
  labelReservas,
  labelIngresos,
  labelEvolucion,
}: {
  serieReservas: SeriePunto[];
  serieIngresos: SeriePunto[];
  locale: string;
  labelReservas: string;
  labelIngresos: string;
  labelEvolucion: string;
}) {
  const fmtMes = new Intl.DateTimeFormat(locale, { month: 'short' });
  const etiqueta = (mes: string) => fmtMes.format(new Date(`${mes}-01T00:00:00Z`));
  const eur = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  const datosReservas = serieReservas.map((p) => ({ ...p, etiqueta: etiqueta(p.mes) }));
  const datosIngresos = serieIngresos.map((p) => ({ ...p, etiqueta: etiqueta(p.mes) }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        <h3 className="font-display text-base font-medium text-(--green) mb-3">
          {labelReservas} · {labelEvolucion}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datosReservas} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,39,36,0.08)" vertical={false} />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} fontSize={12} stroke={EJE} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke={EJE}
            />
            <Tooltip cursor={{ fill: 'rgba(224,168,119,0.12)' }} />
            <Bar dataKey="valor" name={labelReservas} fill={TERRA} radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        <h3 className="font-display text-base font-medium text-(--green) mb-3">
          {labelIngresos} · {labelEvolucion}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={datosIngresos} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={VERDE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={VERDE} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,39,36,0.08)" vertical={false} />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} fontSize={12} stroke={EJE} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke={EJE}
              tickFormatter={(v: number) => eur.format(v)}
            />
            <Tooltip formatter={(v) => eur.format(Number(v))} cursor={{ stroke: 'rgba(43,39,36,0.2)' }} />
            <Area
              type="monotone"
              dataKey="valor"
              name={labelIngresos}
              stroke={VERDE}
              strokeWidth={2}
              fill="url(#gradIngresos)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
