import Link from 'next/link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Dictionary, Locale } from '@/lib/i18n';

export default function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const links = [
    { href: 'gift-box', label: t.nav.giftBox },
    { href: 'about', label: t.footer.about },
    { href: 'shipping', label: t.footer.shipping },
    { href: 'contact', label: t.footer.contact },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: 'grey.900', color: 'grey.100', mt: 8, py: 5 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 2fr' } }}>
          <div>
            <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
              {t.brand.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', mt: 1 }}>
              {t.brand.tagline}
            </Typography>
          </div>
          <nav aria-label={t.footer.links}>
            <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
              {t.footer.links}
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {links.map((l) => (
                <li key={l.href}>
                  <Typography component={Link} href={`/${locale}/${l.href}`} variant="body2" sx={{ color: 'grey.300' }}>
                    {l.label}
                  </Typography>
                </li>
              ))}
            </Stack>
          </nav>
          <div>
            <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
              {t.footer.payments}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {t.footer.paymentNames.map((name) => (
                <Chip key={name} label={name} size="small" variant="outlined" sx={{ color: 'grey.100', borderColor: 'grey.600' }} />
              ))}
            </Stack>
          </div>
        </Box>
        <Divider sx={{ my: 3, borderColor: 'grey.800' }} />
        <Typography variant="caption" sx={{ color: 'grey.500' }}>
          © 2026 {t.brand.name}. {t.footer.rights}
        </Typography>
      </Container>
    </Box>
  );
}
