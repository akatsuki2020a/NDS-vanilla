import Link from 'next/link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CartLines from '@/components/CartLines';
import CouponForm from '@/components/CouponForm';
import TotalsRows from '@/components/TotalsRows';
import { readPricedCart } from '@/lib/cart';
import { toView } from '@/lib/pricing';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).cart.title };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, priced] = await Promise.all([getDictionary(locale), readPricedCart()]);

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {t.cart.title}
      </Typography>

      {priced.lines.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t.cart.empty}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {t.cart.emptyText}
          </Typography>
          <Button component={Link} href={`/${locale}/products`} variant="contained">
            {t.common.continueShopping}
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
          <CartLines lines={toView(priced).lines} locale={locale} t={t} />
          <Paper component="aside" variant="outlined" aria-label={t.cart.summary} sx={{ p: 3, position: { md: 'sticky' }, top: 88 }}>
            <Stack spacing={3}>
              <Typography variant="h6" component="h2">
                {t.cart.summary}
              </Typography>
              <CouponForm locale={locale} t={t} applied={priced.coupon} />
              <TotalsRows totals={priced} locale={locale} t={t} />
              <Button component={Link} href={`/${locale}/checkout`} variant="contained" size="large">
                {t.cart.checkout}
              </Button>
              <Button component={Link} href={`/${locale}/products`}>
                {t.common.continueShopping}
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </>
  );
}
