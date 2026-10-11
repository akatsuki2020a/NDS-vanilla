import { products, type Product } from './data';

export const PAGE_SIZE = 12;
export const PRICE_MAX = 1000;
export const SORTS = ['featured', 'price-asc', 'price-desc', 'rating', 'newest'] as const;
export type Sort = (typeof SORTS)[number];

export type SearchParams = Record<string, string | string[] | undefined>;

export type ListParams = {
  q: string;
  categories: string[];
  min: number;
  max: number;
  inStock: boolean;
  rating: number;
  sort: Sort;
  page: number;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const int = (v: string | undefined, fallback: number) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

export function parseListParams(sp: SearchParams): ListParams {
  const sort = first(sp.sort) as Sort;
  return {
    q: (first(sp.q) ?? '').trim(),
    categories: all(sp.category).flatMap((c) => c.split(',')).filter(Boolean),
    min: Math.max(0, int(first(sp.min), 0)),
    max: Math.min(PRICE_MAX, int(first(sp.max), PRICE_MAX)),
    inStock: first(sp.instock) === '1',
    rating: Math.min(5, Math.max(0, int(first(sp.rating), 0))),
    sort: SORTS.includes(sort) ? sort : 'featured',
    page: Math.max(1, int(first(sp.page), 1)),
  };
}

const sorters: Record<Sort, (a: Product, b: Product) => number> = {
  featured: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => b.created.localeCompare(a.created),
};

export function queryProducts(params: ListParams) {
  const q = params.q.toLowerCase();
  const filtered = products
    .filter((p) => !params.categories.length || params.categories.includes(p.category))
    .filter((p) => p.price >= params.min && p.price <= params.max)
    .filter((p) => !params.inStock || p.stock > 0)
    .filter((p) => p.rating >= params.rating)
    .filter((p) => !q || p.name_ar.includes(params.q) || p.name_en.toLowerCase().includes(q))
    .sort(sorters[params.sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(params.page, pages);
  return {
    total: filtered.length,
    pages,
    page,
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}
