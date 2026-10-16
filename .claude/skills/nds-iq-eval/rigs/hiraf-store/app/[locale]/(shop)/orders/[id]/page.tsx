import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OrderDetails from '@/components/OrderDetails';
import StatusChip from '@/components/StatusChip';
import { formatDate } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getOrder } from '@/lib/store';

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const order = getOrder(id);
  if (!order) notFound();
  const t = await getDictionary(locale);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t.order.thanks}
        </Typography>
        <Typography color="text.secondary">{t.order.thanksText}</Typography>
      </div>
      <Stack direction="row" spacing={2} alignItems="center" useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Typography variant="h6" component="p">
          {t.order.number}: <bdi>{order.id}</bdi>
        </Typography>
        <StatusChip status={order.status} t={t} />
        <Typography variant="body2" color="text.secondary">
          {formatDate(order.created, locale, true)}
        </Typography>
      </Stack>
      <OrderDetails order={order} locale={locale} t={t} />
      <Stack direction="row" spacing={2}>
        <Button component={Link} href={`/${locale}/orders/${order.id}/track`} variant="contained">
          {t.tracking.trackOrder}
        </Button>
        <Button component={Link} href={`/${locale}/products`}>
          {t.common.continueShopping}
        </Button>
      </Stack>
    </Stack>
  );
}
