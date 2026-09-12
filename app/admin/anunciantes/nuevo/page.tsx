import { getI18n } from '@/lib/i18n/server';
import NuevoAnuncianteClient from './NuevoAnuncianteClient';

export default async function NuevoAnunciantePage() {
  const { locale, dict } = await getI18n();
  return <NuevoAnuncianteClient dict={dict.panelAdmin} categorias={dict.common.categoriasAnunciante} locale={locale} />;
}
