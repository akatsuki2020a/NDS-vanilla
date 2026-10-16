import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).pages.shipping.title };
}

export default async function ShippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const page = t.pages.shipping;

  return (
    <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '240px 1fr' }, alignItems: 'start' }}>
      <Paper component="nav" variant="outlined" aria-label={page.onThisPage} sx={{ p: 2, position: { md: 'sticky' }, top: 88 }}>
        <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
          {page.onThisPage}
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, lineHeight: 2 }}>
          {page.sections.map((s) => (
            <li key={s.id}>
              <Link href={`#${s.id}`} underline="hover">
                {s.title}
              </Link>
            </li>
          ))}
        </Box>
      </Paper>

      <article style={{ maxWidth: 760 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          {page.title}
        </Typography>
        <Typography sx={{ mb: 4, lineHeight: 1.9 }} color="text.secondary">
          {page.intro}
        </Typography>
        {page.sections.map((s) => (
          <section key={s.id} aria-labelledby={s.id} style={{ marginBottom: 32 }}>
            <Typography id={s.id} variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1.5, scrollMarginTop: 88 }}>
              {s.title}
            </Typography>
            {s.body.map((text) => (
              <Typography key={text} sx={{ mb: 1.5, lineHeight: 1.9 }}>
                {text}
              </Typography>
            ))}
          </section>
        ))}
      </article>
    </Box>
  );
}
