'use client';
import { useState, useRef } from 'react';
import { registrarNegocio } from '@/lib/actions/registroNegocio';
import type { Dictionary } from '@/lib/i18n/dictionaries/es';

const ZONA_VALUES = [
  'Estepona', 'Manilva', 'Casares', 'San Pedro de Alcántara', 'Puerto Banús', 'Benahavís',
  'Marbella', 'Fuengirola', 'Torremolinos', 'Málaga',
];

interface Props {
  precioBasico: string;
  precioDestacado: string;
  precioBasicoAnual: string;
  precioDestacadoAnual: string;
  waHref: string;
  t: Dictionary['paraNegocios']['form'];
}

export function FormNegocio({ precioBasico, precioDestacado, precioBasicoAnual, precioDestacadoAnual, waHref, t }: Props) {
  const CATEGORIAS = [
    { value: 'inmobiliaria', label: t.catInmobiliaria },
    { value: 'salud',        label: t.catSalud },
    { value: 'legal',        label: t.catLegal },
    { value: 'restauracion', label: t.catRestauracion },
    { value: 'comercio',     label: t.catComercio },
    { value: 'otros',        label: t.catOtros },
  ];
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<'basico' | 'destacado'>('basico');
  const [facturacion, setFacturacion] = useState<'mensual' | 'anual'>('mensual');
  const formRef = useRef<HTMLFormElement>(null);

  const planes = [
    {
      value: 'basico' as const,
      label: t.basicoLabel,
      precioMensual: precioBasico,
      precioAnual: precioBasicoAnual,
      desc: t.basicoDesc,
    },
    {
      value: 'destacado' as const,
      label: t.destacadoLabel,
      precioMensual: precioDestacado,
      precioAnual: precioDestacadoAnual,
      desc: t.destacadoDesc,
    },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await registrarNegocio(fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDone(true);
      formRef.current?.reset();
    }
  }

  if (done) {
    return (
      <div
        className="rounded-xl border p-10 text-center"
        style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--green)' }}>
          {t.okTitulo}
        </h3>
        <p className="text-sm" style={{ color: 'var(--ink)', opacity: 0.7 }}>
          {t.okTexto}
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border p-8 space-y-6"
      style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
    >
      {/* Toggle facturación */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          {t.facturacion}
        </p>
        <div
          className="inline-flex rounded-lg p-1 gap-1"
          style={{ background: 'var(--bone)', border: '1px solid var(--line)' }}
        >
          {(['mensual', 'anual'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFacturacion(f)}
              className="relative px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                background: facturacion === f ? 'var(--green)' : 'transparent',
                color: facturacion === f ? 'var(--bone)' : 'var(--ink)',
              }}
            >
              {f === 'mensual' ? t.mensual : t.anual}
              {f === 'anual' && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: facturacion === 'anual' ? 'rgba(247,242,233,0.2)' : 'var(--terra)',
                    color: facturacion === 'anual' ? 'var(--bone)' : 'var(--bone)',
                  }}
                >
                  {t.dosMenos}
                </span>
              )}
            </button>
          ))}
        </div>
        {facturacion === 'anual' && (
          <p className="text-xs mt-2" style={{ color: 'var(--terra)' }}>
            {t.ahorro}
          </p>
        )}
      </div>

      {/* Plan selector */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--ink)', opacity: 0.6 }}>
          {t.plan} *
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {planes.map((p) => {
            const precio = facturacion === 'anual' ? p.precioAnual : p.precioMensual;
            const sufijo = facturacion === 'anual' ? t.ano : t.mes;
            return (
              <label
                key={p.value}
                className="flex flex-col gap-2 p-4 rounded-lg border cursor-pointer transition-all"
                style={{
                  borderColor: plan === p.value ? 'var(--green)' : 'var(--line)',
                  background: plan === p.value ? 'rgba(44,74,59,0.07)' : 'var(--bone)',
                }}
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.value}
                  checked={plan === p.value}
                  onChange={() => setPlan(p.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: 'var(--green)' }}>{p.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold" style={{ color: 'var(--terra)' }}>
                      {precio}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ink)', opacity: 0.5 }}>{sufijo}</span>
                    {facturacion === 'anual' && (
                      <p className="text-xs" style={{ color: 'var(--ink)', opacity: 0.45 }}>
                        {t.aproxMes.replace('{precio}', p.value === 'basico' ? '24' : '66')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.6 }}>{p.desc}</p>
              </label>
            );
          })}
        </div>
        <input type="hidden" name="facturacion" value={facturacion} />
      </div>

      {/* Datos del negocio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.nombreNegocio} *
          </label>
          <input
            name="nombre_negocio"
            required
            type="text"
            placeholder={t.nombreNegocioPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.categoria} *
          </label>
          <select
            name="categoria"
            required
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value="">{t.categoriaPlaceholder}</option>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.zona}
          </label>
          <select
            name="zona"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value="">{t.zonaPlaceholder}</option>
            {ZONA_VALUES.map((z) => <option key={z} value={z}>{z}</option>)}
            <option value="Toda la Costa del Sol">{t.todaCostaDelSol}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.emailContacto} *
          </label>
          <input
            name="email"
            required
            type="email"
            placeholder={t.emailPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.telefono}
          </label>
          <input
            name="telefono"
            type="tel"
            placeholder={t.telefonoPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.whatsapp}
          </label>
          <input
            name="whatsapp"
            type="tel"
            placeholder={t.whatsappPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.web}
          </label>
          <input
            name="web"
            type="url"
            placeholder={t.webPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
            {t.descripcion}
          </label>
          <textarea
            name="descripcion_es"
            rows={3}
            placeholder={t.descripcionPlaceholder}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
            style={{ background: 'var(--bone)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-7 py-3.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--green)', color: 'var(--bone)' }}
        >
          {pending ? t.enviando : t.enviar}
        </button>
        {waHref !== '#' && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--terra)' }}
          >
            {t.whatsappDudas}
          </a>
        )}
      </div>
    </form>
  );
}
