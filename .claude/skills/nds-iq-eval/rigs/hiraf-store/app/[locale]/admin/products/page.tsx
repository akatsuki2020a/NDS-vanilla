import { notFound } from 'next/navigation';
import Typography from '@mui/material/Typography';
import ProductsTable from '@/components/ProductsTable';
import { categories, categoryName, productName, products } from '@/lib/data';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).admin.products };
}

export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  const rows = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: productName(p, locale),
    category: categoryName(categories.find((c) => c.id === p.category)!, locale),
    price: p.price,
    stock: p.stock,
  }));

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        {t.admin.products}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t.admin.productsPage.hint}
      </Typography>
      <ProductsTable locale={locale} t={t} initial={rows} />
    </>
  );
}
