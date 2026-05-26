import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import type { ServiceCategory } from '@/types/supabase';
import {
  IconSalud, IconTramites, IconNotaria, IconPropiedad,
  IconBanca, IconTelefono, IconEntrevista, IconEspanol,
} from '@/components/icons/ServiceIcons';

export const metadata = {
  title: 'Servicios | Costa Companion',
  description: 'Acompañamiento lingüístico en la Costa del Sol: salud, trámites, notaría, banca y más.',
};

const waNum = process.env.NEXT_PUBLIC_WHATSAPP ?? '';
const waHref = waNum ? `https://wa.me/${waNum.replace(/\D/g, '')}` : '#';

type ServiceDef = {
  key: string;
  titulo: string;
  texto: string;
  detalle: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

const SERVICIOS_DEF: ServiceDef[] = [
  {
    key: 'acompanamiento-medico',
    icon: IconSalud,
    titulo: 'Salud',
    texto: 'Acompañamiento al médico, a urgencias o al especialista.',
    detalle: 'Explicar lo que te pasa y entender el diagnóstico, sin perderte en la consulta. Tu acompañante está contigo desde la espera hasta que salís y ya sabes exactamente qué hacer.',
  },
  {
    key: 'tramites',
    icon: IconTramites,
    titulo: 'Trámites y administración',
    texto: 'Policía, denuncias, Extranjería y NIE, empadronamiento, citas oficiales.',
    detalle: 'La burocracia española, en tu idioma. Tu acompañante te ayuda a preparar la documentación, te acompaña a la cita y te explica qué ha pasado y qué tienes que hacer después.',
  },
  {
    key: 'notaria-gestoria',
    icon: IconNotaria,
    titulo: 'Notaría y gestoría',
    texto: 'Firmas, poderes, documentos oficiales.',
    detalle: 'Saber qué estás firmando antes de firmarlo. Tu acompañante revisa contigo el documento, te lo explica en tu idioma y está presente durante la firma para que no haya sorpresas.',
  },
  {
    key: 'compraventa-propiedad',
    icon: IconPropiedad,
    titulo: 'Compraventa de propiedades',
    texto: 'Visitas, negociación, firma.',
    detalle: 'Acompañamiento en una de las decisiones más importantes que tomarás aquí. Desde la visita al inmueble hasta la firma ante notario, con alguien que habla tu idioma y el de aquí.',
  },
  {
    key: 'banca',
    icon: IconBanca,
    titulo: 'Banca',
    texto: 'Abrir o gestionar cuentas, entender las condiciones, hablar con tu oficina.',
    detalle: 'Para las gestiones bancarias donde el idioma importa: abrir cuentas, entender contratos, resolver problemas con tu oficina o gestionar productos financieros.',
  },
  {
    key: 'interpretacion-telefonica',
    icon: IconTelefono,
    titulo: 'Interpretación telefónica urgente',
    texto: 'Cuando necesitas a alguien al teléfono ahora mismo, en directo.',
    detalle: 'Para esos momentos en los que hay que llamar a la seguridad social, a la clínica o a cualquier organismo y el idioma es una barrera. Tu acompañante media en tiempo real.',
  },
  {
    key: 'preparacion-entrevista',
    icon: IconEntrevista,
    titulo: 'Preparación de entrevistas',
    texto: 'Para llegar con seguridad a una entrevista de trabajo.',
    detalle: 'Preparamos contigo las respuestas habituales, el vocabulario específico del sector y el contexto cultural para que la entrevista salga bien.',
  },
  {
    key: 'clases-espanol',
    icon: IconEspanol,
    titulo: 'Clases de español',
    texto: 'Adaptadas a tu nivel, desde lo básico hasta la conversación. Sueltas o en bonos.',
    detalle: 'Porque a veces la mejor ayuda es dejar de necesitarla. Clases individuales con acompañantes que conocen las situaciones cotidianas de la vida en la costa.',
  },
];

const MULTI_KEYS: Record<string, string[]> = {
  tramites: ['policia-permisos', 'denuncias', 'extranjeria-nie', 'empadronamiento', 'citas-oficiales'],
};

export default async function ServiciosPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    supabase = null;
  }

  let categories: ServiceCategory[] = [];
  if (supabase) {
    const { data } = await supabase.from('service_categories').select('*');
    categories = (data ?? []) as unknown as ServiceCategory[];
  }

  function getCategoryId(key: string): string | null {
    const multiKeys = MULTI_KEYS[key];
    if (multiKeys) {
      const found = categories.find((c) => multiKeys.includes(c.key));
      return found?.id ?? null;
    }
    const found = categories.find((c) => c.key === key);
    return found?.id ?? null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      {/* Hero */}
      <section
        className="relative py-20 px-6 text-center overflow-hidden"
        style={{ background: 'var(--green)' }}
      >
        <Image
          src="/images/estepona-calle.jpg"
          alt="Callejón blanco con macetas en Estepona"
          fill
          className="object-cover"
          style={{ opacity: 0.2 }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(28,50,38,0.55)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="font-display text-4xl sm:text-5xl font-semibold mb-4"
            style={{ color: 'var(--bone)' }}
          >
            Lo que hacemos contigo
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(247,244,239,0.78)' }}>
            En Costa Companion no traducimos documentos y nos despedimos. Te acompañamos a la gestión, sea cual sea, y nos quedamos hasta que todo está claro.
          </p>
        </div>
      </section>

      {/* Servicios */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {SERVICIOS_DEF.map((srv) => {
          const catId = getCategoryId(srv.key);
          const directorioHref = catId ? `/directorio?categoria=${catId}` : '/directorio';
          return (
            <div
              key={srv.key}
              className="rounded-xl border p-8 flex flex-col sm:flex-row gap-6"
              style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--green)', color: 'var(--bone)' }}
              >
                <srv.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--green)' }}>
                  {srv.titulo}
                </h2>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--ink)', opacity: 0.55 }}>
                  {srv.texto}
                </p>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--ink)', opacity: 0.75 }}>
                  {srv.detalle}
                </p>
                <Link
                  href={directorioHref}
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--terra)' }}
                >
                  Ver acompañantes para {srv.titulo.toLowerCase()}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}

        {/* Cierre */}
        <div className="text-center py-10 border-t" style={{ borderColor: 'var(--line)' }}>
          <p className="text-base mb-6" style={{ color: 'var(--ink)', opacity: 0.7 }}>
            ¿No ves exactamente lo que necesitas? Escríbenos por WhatsApp y te decimos si podemos ayudarte. Casi siempre, sí.
          </p>
          {waNum ? (
            <a
              href={waHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--green)', color: 'var(--bone)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.09.537 4.09 1.475 5.838L0 24l6.316-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.587 9.587 0 01-4.893-1.341l-.351-.208-3.742.858.875-3.647-.228-.373A9.556 9.556 0 012.4 12c0-5.292 4.308-9.6 9.6-9.6s9.6 4.308 9.6 9.6-4.308 9.6-9.6 9.6z"/>
              </svg>
              Escribir por WhatsApp
            </a>
          ) : (
            <span className="text-sm" style={{ color: 'var(--ink)', opacity: 0.4 }}>
              Contacto por WhatsApp — próximamente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
