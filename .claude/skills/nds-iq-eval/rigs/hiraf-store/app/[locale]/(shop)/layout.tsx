import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import ShopHeader from '@/components/ShopHeader';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';
import { notFound } from 'next/navigation';

export default async function ShopLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const { store } = getSettings();

  return (
    <>
      <ShopHeader locale={locale} t={t} />
      {store.open ? null : (
        <Alert severity="warning" icon={false} sx={{ justifyContent: 'center', borderRadius: 0 }}>
          {store.closedMessage || t.admin.settings.closedDefault}
        </Alert>
      )}
      <Box component="main" id="main-content">
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          {children}
        </Container>
      </Box>
      <Footer locale={locale} t={t} />
      <BackToTop label={t.common.backToTop} />
    </>
  );
}
