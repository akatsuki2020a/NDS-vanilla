import { getProductById, variantLabel, type Product } from './data';
import { round2, vatOf } from './fees';
import { BOXES, BOX_IMAGE, WRAP_FEE, boxName, type BoxContent } from './gift';
import type { CartLineView, CartView } from './cart-view';
import { getSettings } from './settings';

export const WELCOME_MIN = 100;
export const MAX_QTY = 10;

/** A cart line. A gift box has a `box` and a made-up productId ("box-<id>"). */
export type Item = { productId: string; variant?: string; qty: number; box?: BoxContent };

export const lineKey = (item: { productId: string; variant?: string }) =>
  `${item.productId}:${item.variant ?? ''}`;

export function unitPrice(product: Product, variantId?: string): number {
  const delta = product.variants?.find((v) => v.id === variantId)?.delta ?? 0;
  return product.price + delta;
}

/** Box price: the box, optional wrapping, and every item at its default size. */
export function boxPrice(box: BoxContent): number {
  const items = box.items.reduce((sum, i) => sum + (getProductById(i.productId)?.price ?? 0) * i.qty, 0);
  return BOXES[box.size].price + (box.wrap ? WRAP_FEE : 0) + items;
}

export type CouponResult =
  | { ok: true; code: string; kind: 'percent' | 'shipping' }
  | { ok: false; reason: 'invalid' | 'expired' | 'minimum'; min?: number };

export function checkCoupon(code: string, subtotal: number): CouponResult {
  switch (code.trim().toUpperCase()) {
    case 'WELCOME10':
      return subtotal >= WELCOME_MIN
        ? { ok: true, code: 'WELCOME10', kind: 'percent' }
        : { ok: false, reason: 'minimum', min: WELCOME_MIN };
    case 'FREESHIP':
      return { ok: true, code: 'FREESHIP', kind: 'shipping' };
    case 'EXPIRED5':
      return { ok: false, reason: 'expired' };
    default:
      return { ok: false, reason: 'invalid' };
  }
}

export type PricedLine = Item & { key: string; product?: Product; unit: number; total: number };

export type Priced = {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  vat: number;
  total: number;
  coupon?: string;
};

export function priceItems(items: Item[], coupon?: string): Priced {
  const lines: PricedLine[] = [];
  for (const item of items) {
    if (item.box) {
      const unit = boxPrice(item.box);
      lines.push({ ...item, key: lineKey(item), unit, total: unit * item.qty });
      continue;
    }
    const product = getProductById(item.productId);
    if (!product) continue;
    const unit = unitPrice(product, item.variant);
    lines.push({ ...item, key: lineKey(item), product, unit, total: unit * item.qty });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  const result = coupon ? checkCoupon(coupon, subtotal) : undefined;
  const active = result?.ok ? result : undefined;
  const discount = active?.kind === 'percent' ? round2(subtotal * 0.1) : 0;
  const net = subtotal - discount;
  const { fee, freeOver } = getSettings().shipping;
  const freeShip = active?.kind === 'shipping' || net > freeOver || lines.length === 0;
  const shipping = freeShip ? 0 : fee;
  const total = round2(net + shipping);
  return {
    lines,
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal,
    discount,
    shipping,
    vat: vatOf(total),
    total,
    coupon: active?.code,
  };
}

export function toView(priced: Priced): CartView {
  const lines: CartLineView[] = priced.lines.map((l) => {
    if (l.box) {
      return {
        key: l.key,
        slug: '',
        name_ar: boxName(l.box.size, 'ar'),
        name_en: boxName(l.box.size, 'en'),
        image: BOX_IMAGE,
        qty: l.qty,
        unit: l.unit,
        total: l.total,
        stock: MAX_QTY,
        box: {
          items: l.box.items.map((i) => {
            const p = getProductById(i.productId);
            return { name_ar: p?.name_ar ?? i.productId, name_en: p?.name_en ?? i.productId, qty: i.qty };
          }),
          message: l.box.message,
          wrap: l.box.wrap,
        },
      };
    }
    const product = l.product!;
    const variant = product.variants?.find((v) => v.id === l.variant);
    return {
      key: l.key,
      slug: product.slug,
      name_ar: product.name_ar,
      name_en: product.name_en,
      image: product.images[0],
      variant_ar: variant && variantLabel(variant, 'ar'),
      variant_en: variant && variantLabel(variant, 'en'),
      qty: l.qty,
      unit: l.unit,
      total: l.total,
      stock: product.stock,
    };
  });
  return { count: priced.count, subtotal: priced.subtotal, lines };
}
