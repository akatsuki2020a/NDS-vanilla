import Link from 'next/link';
import { headers } from 'next/headers';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { getDictionary, isLocale } from '@/lib/i18n';

/** Localized 404. The middleware leaves the locale in the x-locale request header. */
export default async function NotFoundView({ homePath = '' }: { homePath?: string }) {
  const header = (await headers()).get('x-locale') ?? 'ar';
  const locale = isLocale(header) ? header : 'ar';
  const t = await getDictionary(locale);

  return (
    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', maxWidth: 560, mx: 'auto', mt: 4 }}>
      <Typography variant="h2" component="p" color="primary" sx={{ fontWeight: 700 }}>
        404
      </Typography>
      <Typography variant="h5" component="h1" gutterBottom>
        {t.errors.notFoundTitle}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t.errors.notFoundText}
      </Typography>
      <Button component={Link} href={`/${locale}${homePath}`} variant="contained">
        {t.errors.home}
      </Button>
    </Paper>
  );
}
