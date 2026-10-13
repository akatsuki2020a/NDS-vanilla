import Image from 'next/image';
import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FlashSale from '@/components/FlashSale';
import ProductGrid from '@/components/ProductGrid';
import { categories, categoryName, products } from '@/lib/data';
import { getDictionary, isLocale } from '@/lib/i18n';

// Tonight 23:59 Riyadh (UTC+3, no daylight saving).
function saleEnd() {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
  return `${day}T23:59:00+03:00`;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const bestSellers = products.filter((p) => p.badges?.includes('bestseller')).slice(0, 8);

  return (
    <Stack spacing={6}>
      <Paper
        component="section"
        sx={{ p: { xs: 4, md: 8 }, color: 'common.white', bgcolor: 'primary.dark', backgroundImage: 'linear-gradient(135deg, #1b5e3b, #0f3d26)', borderRadius: 3 }}
      >
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
          {t.home.heroTitle}
        </Typography>
        <Typography variant="h6" component="p" sx={{ mb: 3, maxWidth: 560, fontWeight: 400 }}>
          {t.home.heroLine}
        </Typography>
        <Button component={Link} href={`/${locale}/products`} variant="contained" color="secondary" size="large">
          {t.home.heroButton}
        </Button>
      </Paper>

      <FlashSale locale={locale} end={saleEnd()} labels={t.home.flash} />

      <section aria-labelledby="home-categories">
        <Typography id="home-categories" variant="h5" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
          {t.home.categoriesTitle}
        </Typography>
        <Box component="ul" sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }, listStyle: 'none', p: 0, m: 0 }}>
          {categories.map((c) => (
            <li key={c.id}>
              <Card variant="outlined">
                <CardActionArea component={Link} href={`/${locale}/products?category=${c.id}`}>
                  <Box sx={{ position: 'relative', aspectRatio: '1 / 1' }}>
                    <Image src={`/products/${c.id}.svg`} alt="" fill sizes="(max-width: 900px) 50vw, 180px" />
                  </Box>
                  <Typography component="span" sx={{ display: 'block', p: 1.5, textAlign: 'center', fontWeight: 600 }}>
                    {categoryName(c, locale)}
                  </Typography>
                </CardActionArea>
              </Card>
            </li>
          ))}
        </Box>
      </section>

      <section aria-labelledby="home-best">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography id="home-best" variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            {t.home.bestSellersTitle}
          </Typography>
          <Button component={Link} href={`/${locale}/products`}>
            {t.home.viewAll}
          </Button>
        </Stack>
        <ProductGrid products={bestSellers} locale={locale} t={t} />
      </section>

      <Paper component="section" variant="outlined" sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', bgcolor: 'secondary.light', borderColor: 'secondary.main' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            {t.home.promoTitle}
          </Typography>
          <Typography>{t.home.promoText}</Typography>
        </Box>
        <Chip label="WELCOME10" color="secondary" sx={{ fontWeight: 700, letterSpacing: 1 }} />
      </Paper>
    </Stack>
  );
}
