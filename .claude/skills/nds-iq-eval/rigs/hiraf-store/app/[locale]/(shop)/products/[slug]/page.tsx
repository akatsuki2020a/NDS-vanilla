import Link from 'next/link';
import { notFound } from 'next/navigation';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddToCart from '@/components/AddToCart';
import Gallery from '@/components/Gallery';
import ProductCard from '@/components/ProductCard';
import ProductTabs from '@/components/ProductTabs';
import {
  LOW_STOCK,
  categories,
  categoryName,
  getProduct,
  getReviews,
  productDescription,
  productName,
  products,
  variantLabel,
} from '@/lib/data';
import { fmt } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!isLocale(locale) || !product) return {};
  return { title: productName(product, locale) };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = getProduct(slug);
  if (!product) notFound();

  const t = await getDictionary(locale);
  const name = productName(product, locale);
  const category = categories.find((c) => c.id === product.category)!;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 5);
  const about = t.product.about[product.category as keyof typeof t.product.about];

  return (
    <Stack spacing={5}>
      <Breadcrumbs aria-label={t.common.breadcrumb}>
        <Link href={`/${locale}`}>{t.nav.home}</Link>
        <Link href={`/${locale}/products?category=${category.id}`}>{categoryName(category, locale)}</Link>
        <Typography color="text.primary">{name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
        <Gallery
          images={product.images}
          name={name}
          labels={{
            thumb: t.product.thumb,
            zoom: t.product.zoom,
            close: t.miniCart.close,
            previous: t.product.previous,
            next: t.product.nextImage,
          }}
        />
        <Stack spacing={2}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Rating value={product.rating} precision={0.1} readOnly aria-label={`${product.rating}`} />
            <Typography variant="body2" color="text.secondary">
              {fmt(t.common.reviewsCount, { n: product.reviews_count })}
            </Typography>
          </Stack>
          <AddToCart
            locale={locale}
            t={t}
            productId={product.id}
            price={product.price}
            compareAt={product.compare_at}
            stock={product.stock}
            lowStock={LOW_STOCK}
            variants={product.variants?.map((v) => ({ id: v.id, label: variantLabel(v, locale), delta: v.delta }))}
          />
        </Stack>
      </Box>

      <ProductTabs
        locale={locale}
        t={t}
        description={`${productDescription(product, locale)} ${about}`}
        reviews={getReviews(product.id)}
      />

      <section aria-labelledby="faq">
        <Typography id="faq" variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
          {t.product.faqTitle}
        </Typography>
        {t.product.faq.map((item) => (
          <Accordion key={item.q} disableGutters variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h3" fontWeight={600}>
                {item.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{item.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </section>

      {related.length ? (
        <section aria-labelledby="related">
          <Typography id="related" variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
            {t.product.related}
          </Typography>
          <Box
            component="ul"
            sx={{ display: 'flex', gap: 2, overflowX: 'auto', scrollSnapType: 'x proximity', listStyle: 'none', p: 0, pb: 1, m: 0 }}
          >
            {related.map((p) => (
              <Box component="li" key={p.id} sx={{ flex: '0 0 220px', scrollSnapAlign: 'start' }}>
                <ProductCard product={p} locale={locale} t={t} />
              </Box>
            ))}
          </Box>
        </section>
      ) : null}
    </Stack>
  );
}
