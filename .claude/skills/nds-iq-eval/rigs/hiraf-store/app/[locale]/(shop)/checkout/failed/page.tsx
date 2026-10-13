import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getDictionary, isLocale } from '@/lib/i18n';

export default async function CheckoutFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { reason } = await searchParams;
  const t = await getDictionary(locale);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
        {t.checkout.failedTitle}
      </Typography>
      <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
        {reason === 'declined' ? t.checkout.failedDeclined : t.checkout.failedGeneric}
      </Alert>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t.checkout.failedHelp}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Button component={Link} href={`/${locale}/checkout`} variant="contained">
          {t.checkout.retryPayment}
        </Button>
        <Button component={Link} href={`/${locale}/checkout`} variant="outlined">
          {t.checkout.changeMethod}
        </Button>
        <Button component={Link} href={`/${locale}/cart`}>
          {t.checkout.backToCart}
        </Button>
      </Stack>
    </Paper>
  );
}
