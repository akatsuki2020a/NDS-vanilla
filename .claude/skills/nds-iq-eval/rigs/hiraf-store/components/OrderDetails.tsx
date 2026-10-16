import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OrderItemsTable from './OrderItemsTable';
import TotalsRows from './TotalsRows';
import { fmt } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Order } from '@/lib/store';

type CityKey = keyof Dictionary['cities'];

/** Items, address, delivery, payment and totals of one order. Shared by the customer and admin pages. */
export default function OrderDetails({ order, locale, t }: { order: Order; locale: Locale; t: Dictionary }) {
  const { address } = order;
  const info = [
    { title: t.order.address, lines: [order.customer.name, order.customer.phone, `${t.cities[address.city as CityKey] ?? address.city}، ${address.district}`, `${address.street} ${address.building}`, address.notes].filter(Boolean) },
    { title: t.order.delivery, lines: [t.delivery[order.delivery]] },
    {
      title: t.order.payment,
      lines: [t.payment[order.payment], order.cardLast4 ? fmt(t.order.cardEnding, { n: order.cardLast4 }) : ''].filter(Boolean),
    },
  ];

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          {t.order.items}
        </Typography>
        <OrderItemsTable order={order} locale={locale} t={t} />
      </Paper>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        {info.map((block) => (
          <Paper key={block.title} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
              {block.title}
            </Typography>
            {block.lines.map((line) => (
              <Typography key={line} variant="body2">
                {line}
              </Typography>
            ))}
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ p: 2, maxWidth: 420, alignSelf: 'flex-end', width: '100%' }}>
        <TotalsRows totals={order.totals} locale={locale} t={t} />
      </Paper>
    </Stack>
  );
}
