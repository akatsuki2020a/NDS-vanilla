import { notFound } from 'next/navigation';
import ContactForm from '@/components/ContactForm';
import ContentPage from '@/components/ContentPage';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).pages.contact.title };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  return (
    <ContentPage title={t.pages.contact.title} paragraphs={t.pages.contact.body}>
      <ContactForm locale={locale} t={t} />
    </ContentPage>
  );
}
