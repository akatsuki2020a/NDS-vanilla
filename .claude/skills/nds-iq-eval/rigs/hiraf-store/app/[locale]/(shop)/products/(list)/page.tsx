import Link from 'next/link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ProductFilters from '@/components/ProductFilters';
import ViewToggle from '@/components/ViewToggle';
import ProductGrid from '@/components/ProductGrid';
import UrlPagination from '@/components/UrlPagination';
import { parseListParams, queryProducts, type SearchParams } from '@/lib/catalog';
import { categories, categoryName } from '@/lib/data';
import { fmt, num } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).products.title };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const sp = await searchParams;
  const list = parseListParams(sp);
  const view = sp.view === 'list' ? 'list' : 'grid';
  const { items, total, pages, page } = queryProducts(list);

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        {list.q ? fmt(t.products.searchResults, { q: list.q }) : t.products.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }} role="status">
        {fmt(t.products.results, { n: num(total, locale) })}
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, alignItems: 'start' }}>
        <ProductFilters t={t} categories={categories.map((c) => ({ id: c.id, name: categoryName(c, locale) }))} />
        <div>
          {items.length ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <ViewToggle view={view} labels={t.products.view} />
              </Box>
              <ProductGrid products={items} locale={locale} t={t} layout={view} columns={{ xs: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} />
              <UrlPagination count={pages} page={page} label={t.products.pagination} />
            </>
          ) : (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" component="h2" gutterBottom>
                {t.products.emptyTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {t.products.emptyText}
              </Typography>
              <Button component={Link} href={`/${locale}/products`} variant="contained">
                {t.common.clearFilters}
              </Button>
            </Paper>
          )}
        </div>
      </Box>
    </>
  );
}
