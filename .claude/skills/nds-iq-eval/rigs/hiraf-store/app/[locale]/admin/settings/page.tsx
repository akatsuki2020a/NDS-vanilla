import { notFound } from 'next/navigation';
import Typography from '@mui/material/Typography';
import SettingsForm from '@/components/SettingsForm';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).admin.settings.title };
}

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {t.admin.settings.title}
      </Typography>
      <SettingsForm locale={locale} t={t} initial={getSettings()} />
    </>
  );
}
