import Box from '@mui/material/Box';
import ProductCard from './ProductCard';
import type { Product } from '@/lib/data';
import type { Dictionary, Locale } from '@/lib/i18n';

export default function ProductGrid({
  products,
  locale,
  t,
  layout = 'grid',
  columns = { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
}: {
  products: Product[];
  locale: Locale;
  t: Dictionary;
  layout?: 'grid' | 'list';
  columns?: Record<string, string>;
}) {
  return (
    <Box component="ul" sx={{ display: 'grid', gap: 2, gridTemplateColumns: layout === 'list' ? '1fr' : columns, listStyle: 'none', p: 0, m: 0 }}>
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} locale={locale} t={t} layout={layout} />
        </li>
      ))}
    </Box>
  );
}
