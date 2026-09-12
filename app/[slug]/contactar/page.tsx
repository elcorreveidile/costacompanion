import { getI18n } from '@/lib/i18n/server';
import { ContactarFormClient } from './ContactarFormClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContactarPage({ params }: PageProps) {
  const { slug } = await params;
  const { locale, dict } = await getI18n();

  return <ContactarFormClient slug={slug} locale={locale} t={dict.flujos} />;
}
