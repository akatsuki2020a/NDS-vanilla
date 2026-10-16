import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import ThemeRegistry from '@/components/ThemeRegistry';
import CartProvider from '@/components/CartProvider';
import { dirOf, getDictionary, isLocale } from '@/lib/i18n';
import { readCartView } from '@/lib/cart';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return {
    title: { default: `${t.brand.name} | ${t.brand.tagline}`, template: `%s | ${t.brand.name}` },
    description: t.brand.tagline,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Reading the request headers makes every page dynamic, which the per-request CSP nonce needs.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const [t, cart] = await Promise.all([getDictionary(locale), readCartView()]);

  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body>
        <ThemeRegistry locale={locale} nonce={nonce}>
          <CartProvider locale={locale} initial={cart} labels={t.miniCart}>
            {children}
          </CartProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
