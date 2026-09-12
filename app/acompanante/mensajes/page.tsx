import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import MensajesAcompananteClient from './MensajesAcompananteClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis mensajes | Costa Companion' };

export default async function AcompananteMensajesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  return <MensajesAcompananteClient userId={user.id} />;
}
