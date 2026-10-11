import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Price from './Price';
import { LOW_STOCK, productDescription, productName, type Product } from '@/lib/data';
import type { Dictionary, Locale } from '@/lib/i18n';
import { fmt } from '@/lib/format';

const clamp = (lines: number) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export default function ProductCard({
  product,
  locale,
  t,
  layout = 'grid',
}: {
  product: Product;
  locale: Locale;
  t: Dictionary;
  layout?: 'grid' | 'list';
}) {
  const name = productName(product, locale);
  const out = product.stock <= 0;
  const list = layout === 'list';
  const badges = [
    product.compare_at ? { key: 'sale', color: 'error' as const } : null,
    ...(product.badges ?? []).map((b) => ({ key: b, color: b === 'new' ? ('info' as const) : ('default' as const) })),
  ].filter((b): b is { key: string; color: 'error' | 'info' | 'default' } => b !== null);

  return (
    <Card variant="outlined" sx={{ height: '100%', opacity: out ? 0.75 : 1 }}>
      <CardActionArea
        component={Link}
        href={`/${locale}/products/${product.slug}`}
        sx={{ height: '100%', display: 'flex', flexDirection: list ? 'row' : 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '1 / 1', width: list ? { xs: 112, sm: 160 } : '100%', flexShrink: 0 }}>
          <Image src={product.images[0]} alt="" fill sizes={list ? '160px' : '(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 280px'} />
          <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, insetInlineStart: 8 }}>
            {badges.slice(0, list ? 1 : 3).map((b) => (
              <Chip key={b.key} size="small" color={b.color} label={t.common[b.key as 'sale' | 'new' | 'bestseller' | 'handmade']} />
            ))}
          </Stack>
        </Box>
        <CardContent sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600, lineHeight: 1.4, mb: 0.5, ...clamp(2) }}>
            {name}
          </Typography>
          {list ? (
            <Typography variant="body2" color="text.secondary" component="span" sx={{ mb: 1, ...clamp(2) }}>
              {productDescription(product, locale)}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Rating value={product.rating} precision={0.1} size="small" readOnly aria-label={`${product.rating}`} />
            <Typography variant="caption" color="text.secondary">
              ({product.reviews_count})
            </Typography>
          </Stack>
          <Price price={product.price} compareAt={product.compare_at} locale={locale} />
          {out ? (
            <Typography variant="caption" color="error">
              {t.common.outOfStock}
            </Typography>
          ) : product.stock <= LOW_STOCK ? (
            <Typography variant="caption" color="warning.main">
              {fmt(t.common.lowStock, { n: product.stock })}
            </Typography>
          ) : null}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
