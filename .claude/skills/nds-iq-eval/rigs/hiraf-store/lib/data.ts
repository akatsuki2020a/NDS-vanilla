import categoriesJson from '@/data/categories.json';
import productsJson from '@/data/products.json';
import reviewsJson from '@/data/reviews.json';
import type { Locale } from './i18n';

export type Variant = { id: string; label_ar: string; label_en: string; delta: number };

export type Product = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  category: string;
  price: number;
  compare_at?: number;
  rating: number;
  reviews_count: number;
  stock: number;
  box_slots: 1 | 2;
  variants?: Variant[];
  description_ar: string;
  description_en: string;
  images: string[];
  badges?: string[];
  created: string;
};

export type Category = { id: string; name_ar: string; name_en: string };
export type Review = { name: string; rating: number; date: string; text_ar: string };

export const categories = categoriesJson as Category[];
export const products = productsJson as unknown as Product[];
const reviews = reviewsJson as Record<string, Review[]>;

export { LOW_STOCK } from './constants';

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getReviews = (productId: string) => reviews[productId] ?? [];

export const categoryName = (c: Category, locale: Locale) => (locale === 'ar' ? c.name_ar : c.name_en);
export const productName = (p: Product, locale: Locale) => (locale === 'ar' ? p.name_ar : p.name_en);
export const productDescription = (p: Product, locale: Locale) =>
  locale === 'ar' ? p.description_ar : p.description_en;
export const variantLabel = (v: Variant, locale: Locale) => (locale === 'ar' ? v.label_ar : v.label_en);
