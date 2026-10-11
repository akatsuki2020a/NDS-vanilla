import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { money } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

type Totals = { subtotal: number; discount: number; shipping: number; fees?: number; vat: number; total: number };

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography fontWeight={bold ? 700 : 400} color={bold ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography fontWeight={bold ? 700 : 400}>{value}</Typography>
    </Stack>
  );
}

/** The subtotal-to-total block shared by the cart, checkout and order pages. */
export default function TotalsRows({ totals, locale, t }: { totals: Totals; locale: Locale; t: Dictionary }) {
  return (
    <Stack spacing={1}>
      <Row label={t.cart.subtotal} value={money(totals.subtotal, locale)} />
      {totals.discount ? <Row label={t.cart.discount} value={`- ${money(totals.discount, locale)}`} /> : null}
      <Row label={t.cart.shipping} value={totals.shipping ? money(totals.shipping, locale) : t.cart.free} />
      {totals.fees ? <Row label={t.cart.fees} value={money(totals.fees, locale)} /> : null}
      <Divider />
      <Row label={t.cart.total} value={money(totals.total, locale)} bold />
      <Typography variant="caption" color="text.secondary">
        {t.cart.vatLine} {money(totals.vat, locale)}
      </Typography>
    </Stack>
  );
}
