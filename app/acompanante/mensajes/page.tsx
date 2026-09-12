import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import MensajesAcompananteClient from './MensajesAcompananteClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis mensajes | Costa Companion' };

export default async function AcompananteMensajesPage() {
  const { locale, dict } = await getI18n();

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  return (
    <MensajesAcompananteClient
      userId={user.id}
      t={dict.panelAcompanante.mensajes}
      volverAlPanel={dict.panelAcompanante.shared.volverAlPanel}
      locale={locale}
    />
  );
}
