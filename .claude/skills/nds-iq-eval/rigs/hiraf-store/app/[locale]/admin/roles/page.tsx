import { notFound } from 'next/navigation';
import Typography from '@mui/material/Typography';
import RolesMatrix from '@/components/RolesMatrix';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getMatrix } from '@/lib/roles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).admin.roles.title };
}

export default async function AdminRolesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {t.admin.roles.title}
      </Typography>
      <RolesMatrix locale={locale} t={t} initial={getMatrix()} />
    </>
  );
}
