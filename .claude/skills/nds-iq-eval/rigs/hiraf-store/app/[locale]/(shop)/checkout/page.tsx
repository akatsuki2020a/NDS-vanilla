import { notFound, redirect } from 'next/navigation';
import Typography from '@mui/material/Typography';
import CheckoutForm from '@/components/CheckoutForm';
import { readPricedCart } from '@/lib/cart';
import { toView } from '@/lib/pricing';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).checkout.title };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, priced] = await Promise.all([getDictionary(locale), readPricedCart()]);
  if (priced.lines.length === 0) redirect(`/${locale}/cart`);

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {t.checkout.title}
      </Typography>
      <CheckoutForm
        locale={locale}
        t={t}
        lines={toView(priced).lines}
        base={{ subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping }}
      />
    </>
  );
}
