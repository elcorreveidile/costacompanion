import { getI18n } from '@/lib/i18n/server';
import NuevoAcompananteClient from './NuevoAcompananteClient';

export default async function NuevoAcompanantePage() {
  const { locale, dict } = await getI18n();
  return <NuevoAcompananteClient dict={dict.panelAdmin} locale={locale} />;
}
