import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { money } from '@/lib/format';
import type { Locale } from '@/lib/i18n';

export default function Price({
  price,
  compareAt,
  locale,
  large,
}: {
  price: number;
  compareAt?: number;
  locale: Locale;
  large?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant={large ? 'h5' : 'subtitle1'} component="span" color={compareAt ? 'error.main' : 'text.primary'} fontWeight={700}>
        {money(price, locale)}
      </Typography>
      {compareAt ? (
        <Typography variant="body2" component="s" color="text.secondary">
          {money(compareAt, locale)}
        </Typography>
      ) : null}
    </Stack>
  );
}
