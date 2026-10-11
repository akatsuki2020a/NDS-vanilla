import Link from 'next/link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OrderDetails from '@/components/OrderDetails';
import StatusChip from '@/components/StatusChip';
import StatusForm from '@/components/StatusForm';
import { formatDate } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getOrder } from '@/lib/store';

export default async function AdminOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const order = getOrder(id);
  if (!order) notFound();
  const t = await getDictionary(locale);

  return (
    <Stack spacing={3}>
      <Button component={Link} href={`/${locale}/admin/orders`} sx={{ alignSelf: 'flex-start' }}>
        {t.admin.backToOrders}
      </Button>
      <Stack direction="row" spacing={2} alignItems="center" useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          {t.order.number} <bdi>{order.id}</bdi>
        </Typography>
        <StatusChip status={order.status} t={t} />
        <Typography variant="body2" color="text.secondary">
          {formatDate(order.created, locale, true)}
        </Typography>
      </Stack>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'start' }}>
        <OrderDetails order={order} locale={locale} t={t} />
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              {t.admin.updateStatus}
            </Typography>
            <StatusForm orderId={order.id} current={order.status} locale={locale} t={t} />
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              {t.admin.history}
            </Typography>
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {[...order.history].reverse().map((h, i) => (
                <li key={i}>
                  <Typography variant="body2" fontWeight={600}>
                    {t.status[h.status]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(h.at, locale, true)}
                    {h.note ? ` - ${h.note}` : ''}
                  </Typography>
                </li>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
