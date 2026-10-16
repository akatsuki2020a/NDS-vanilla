import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/StatusChip';
import TrackingView from '@/components/TrackingView';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getOrder } from '@/lib/store';
import { trackingPayload } from '@/lib/tracking';

type CityKey = keyof Awaited<ReturnType<typeof getDictionary>>['cities'];

export default async function TrackPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const order = getOrder(id);
  if (!order) notFound();
  const t = await getDictionary(locale);
  const { address } = order;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center" useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t.tracking.title}
        </Typography>
        <Typography variant="h6" component="p">
          <bdi>{order.id}</bdi>
        </Typography>
        <StatusChip status={order.status} t={t} />
      </Stack>
      <TrackingView
        locale={locale}
        t={t}
        initial={trackingPayload(order)}
        addressLines={[
          order.customer.name,
          `${t.cities[address.city as CityKey] ?? address.city}, ${address.district}`,
          `${address.street} ${address.building}`,
        ]}
      />
      <div>
        <Button component={Link} href={`/${locale}/orders/${order.id}`}>
          {t.tracking.backToOrder}
        </Button>
      </div>
    </Stack>
  );
}
