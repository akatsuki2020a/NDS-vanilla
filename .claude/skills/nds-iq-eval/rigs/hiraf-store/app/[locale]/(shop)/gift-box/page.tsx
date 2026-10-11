import { notFound } from 'next/navigation';
import Typography from '@mui/material/Typography';
import GiftBuilder, { type GiftProduct } from '@/components/GiftBuilder';
import { BOX_CATEGORIES } from '@/lib/gift';
import { productName, products } from '@/lib/data';
import { getDictionary, isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).gift.title };
}

export default async function GiftBoxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  const eligible: GiftProduct[] = products
    .filter((p) => BOX_CATEGORIES.includes(p.category) && p.stock > 0)
    .map((p) => ({ id: p.id, name: productName(p, locale), image: p.images[0], price: p.price, slots: p.box_slots, stock: p.stock }));

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        {t.gift.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        {t.gift.intro}
      </Typography>
      <GiftBuilder locale={locale} t={t} products={eligible} />
    </>
  );
}
