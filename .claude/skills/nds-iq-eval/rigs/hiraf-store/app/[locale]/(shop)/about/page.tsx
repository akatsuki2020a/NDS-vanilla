import { notFound } from 'next/navigation';
import ContentPage from '@/components/ContentPage';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).pages.about.title };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { pages } = await getDictionary(locale);
  return <ContentPage title={pages.about.title} paragraphs={pages.about.body} />;
}
