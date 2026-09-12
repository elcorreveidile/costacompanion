import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getI18n } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/config';
import MensajesClienteClient from './MensajesClienteClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis mensajes | Costa Companion' };

export default async function ClienteMensajesPage() {
  const { locale, dict } = await getI18n();

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, '/auth/login'));

  return (
    <MensajesClienteClient
      userId={user.id}
      t={dict.panelCliente.mensajes}
      volverAlPanel={dict.panelCliente.shared.volverAlPanel}
      locale={locale}
    />
  );
}
