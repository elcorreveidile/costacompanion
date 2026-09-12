import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import MensajesClienteClient from './MensajesClienteClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis mensajes | Costa Companion' };

export default async function ClienteMensajesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  return <MensajesClienteClient userId={user.id} />;
}
