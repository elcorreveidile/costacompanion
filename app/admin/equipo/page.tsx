import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import { EquipoClient } from './EquipoClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Equipo — Admin | Costa Companion' };

export default async function AdminEquipoPage() {
  const user = await getSessionUser();
  if (user?.rol !== 'superadmin') return null; // el middleware ya protege /admin

  const { locale, dict } = await getI18n();
  const t = dict.panelAdmin;

  const rows = await db
    .select({
      id: profiles.id,
      nombre: profiles.nombre,
      email: profiles.email,
      numeroUsuario: profiles.numeroUsuario,
      pinHash: profiles.pinHash,
    })
    .from(profiles)
    .where(eq(profiles.rol, 'superadmin'));

  const superadmins = rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    email: r.email,
    numeroUsuario: r.numeroUsuario,
    tienePin: !!r.pinHash,
  }));

  const labels = {
    thNombre: t.shared.nombre,
    thEmail: t.shared.email,
    thEstadoPin: t.equipo.thEstadoPin,
    conPin: t.equipo.conPin,
    sinPin: t.equipo.sinPin,
    confirmReset: t.equipo.confirmReset,
    reiniciarPin: t.acompanantes.form.reiniciarPin,
    reiniciando: t.acompanantes.form.reiniciando,
    pinNuevo: t.acompanantes.form.pinNuevo,
    apunta: t.acompanantes.form.apuntaPin,
    numeroUsuario: t.shared.numeroUsuario,
    anonimo: '—',
  };

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href={localePath(locale, '/admin')}
          className="text-sm text-(--ink)/50 hover:text-(--ink) transition-colors mb-2 inline-block"
        >
          {t.shared.volverAlPanel}
        </Link>
        <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">{t.equipo.titulo}</h1>
        <p className="text-(--ink)/60 mb-8">{t.equipo.subtitulo}</p>
        <EquipoClient superadmins={superadmins} labels={labels} />
      </div>
    </div>
  );
}
