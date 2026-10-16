'use server';

import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getProductById, products, type Product } from './data';
import { getDictionary, isLocale, type Dictionary, type Locale } from './i18n';
import { fmt } from './format';
import { MAX_QTY, checkCoupon, lineKey, priceItems } from './pricing';
import { BOXES, BOX_CATEGORIES, MESSAGE_MAX, MIN_BOX_ITEMS, type BoxContent, type BoxSize } from './gift';
import { getSettings, saveSettings, type Settings } from './settings';
import { ALL_PERMISSIONS, ROLES, getMatrix, saveMatrix, type Matrix } from './roles';
import { withFees, DELIVERY_FEES, PAYMENT_FEES, type DeliveryId, type PaymentId } from './fees';
import { readCart } from './cart';
import { createOrder, getCart, saveCart, setOrderStatus, ORDER_STATUSES, type Cart, type OrderStatus } from './store';

const localeOf = (fd: FormData): Locale => {
  const value = String(fd.get('locale') ?? '');
  return isLocale(value) ? value : 'ar';
};

/** Returns the visitor's cart, creating the cookie and the cart on first use. */
async function cartForWrite(): Promise<Cart> {
  const jar = await cookies();
  let id = jar.get('cart_id')?.value;
  if (!id) {
    id = randomUUID();
    jar.set('cart_id', id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  }
  return getCart(id) ?? saveCart({ id, items: [] });
}

// ---- cart ----

export type AddResult = { ok: true } | { ok: false; error: 'invalid' | 'out_of_stock' | 'max' };

export async function addToCart(input: { productId: string; variant?: string; qty: number }): Promise<AddResult> {
  const product = getProductById(input.productId);
  const qty = Math.floor(Number(input.qty));
  if (!product || !(qty > 0)) return { ok: false, error: 'invalid' };
  if (product.variants && !product.variants.some((v) => v.id === input.variant)) return { ok: false, error: 'invalid' };
  if (product.stock <= 0) return { ok: false, error: 'out_of_stock' };

  const cart = await cartForWrite();
  const item = { productId: product.id, variant: product.variants ? input.variant : undefined, qty };
  const existing = cart.items.find((i) => lineKey(i) === lineKey(item));
  if ((existing?.qty ?? 0) + qty > Math.min(product.stock, MAX_QTY)) return { ok: false, error: 'max' };
  if (existing) existing.qty += qty;
  else cart.items.push(item);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function updateQty(key: string, qty: number): Promise<void> {
  const cart = await cartForWrite();
  const item = cart.items.find((i) => lineKey(i) === key);
  if (!item) return;
  const limit = item.box ? MAX_QTY : Math.min(getProductById(item.productId)?.stock ?? 0, MAX_QTY);
  if (qty <= 0) cart.items = cart.items.filter((i) => i !== item);
  else item.qty = Math.min(Math.floor(qty), limit);
  revalidatePath('/', 'layout');
}

export async function removeLine(key: string): Promise<void> {
  const cart = await cartForWrite();
  cart.items = cart.items.filter((i) => lineKey(i) !== key);
  revalidatePath('/', 'layout');
}

export type CouponState = { error?: string; applied?: string };

export async function applyCoupon(_prev: CouponState, fd: FormData): Promise<CouponState> {
  const t = await getDictionary(localeOf(fd));
  const code = String(fd.get('code') ?? '').trim().toUpperCase();
  if (!code) return { error: t.cart.errors.required };

  const cart = await cartForWrite();
  const result = checkCoupon(code, priceItems(cart.items).subtotal);
  if (!result.ok) {
    return {
      error: result.reason === 'minimum' ? fmt(t.cart.errors.minimum, { min: result.min ?? 0 }) : t.cart.errors[result.reason],
    };
  }
  cart.coupon = result.code;
  revalidatePath('/', 'layout');
  return { applied: result.code };
}

export async function removeCoupon(): Promise<void> {
  const cart = await cartForWrite();
  cart.coupon = undefined;
  revalidatePath('/', 'layout');
}

// ---- checkout ----

export type CheckoutState = { step: number; errors: Record<string, string> };

const CARD_METHODS = ['mada', 'card'];
const CITIES = ['riyadh', 'jeddah', 'dammam', 'makkah', 'madinah', 'abha', 'buraydah', 'tabuk'];

function validateStep(step: number, v: Record<string, string>, t: Dictionary): Record<string, string> {
  const e: Record<string, string> = {};
  const need = (name: string, ok: boolean, message: string) => {
    if (!v[name]?.trim()) e[name] = t.validation.required;
    else if (!ok) e[name] = message;
  };
  if (step === 0) {
    need('fullName', (v.fullName ?? '').trim().length >= 3, t.validation.fullName);
    need('phone', /^05\d{8}$/.test((v.phone ?? '').replace(/\s/g, '')), t.validation.phone);
    need('city', CITIES.includes(v.city), t.validation.required);
    need('district', true, '');
    need('street', true, '');
    need('building', /^\d{1,5}$/.test(v.building ?? ''), t.validation.building);
  }
  if (step === 1 && !(v.delivery in DELIVERY_FEES)) e.delivery = t.validation.required;
  if (step === 2) {
    if (!(v.payment in PAYMENT_FEES)) e.payment = t.validation.required;
    else if (CARD_METHODS.includes(v.payment)) {
      need('cardNumber', /^\d{16}$/.test((v.cardNumber ?? '').replace(/[\s-]/g, '')), t.validation.cardNumber);
      need('cardName', true, '');
      const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.expiry ?? '');
      need('expiry', !!m, t.validation.expiry);
      if (m && new Date(2000 + Number(m[2]), Number(m[1]), 1) <= new Date()) e.expiry = t.validation.expired;
      need('cvv', /^\d{3}$/.test(v.cvv ?? ''), t.validation.cvv);
    }
  }
  return e;
}

export async function checkoutAction(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const locale = localeOf(fd);
  const t = await getDictionary(locale);
  const v = Object.fromEntries([...fd.entries()].map(([k, x]) => [k, String(x)]));
  const step = Number(v.step) || 0;

  if (v.intent !== 'place') {
    const errors = validateStep(step, v, t);
    return Object.keys(errors).length ? { step, errors } : { step: Math.min(step + 1, 2), errors: {} };
  }

  for (let s = 0; s < 3; s++) {
    const errors = validateStep(s, v, t);
    if (Object.keys(errors).length) return { step: s, errors };
  }

  const settings = getSettings();
  if (!settings.store.open) return { step: 2, errors: { _form: settings.store.closedMessage || t.admin.settings.closedDefault } };

  const cart = await readCart();
  if (!cart || !cart.items.length) redirect(`/${locale}/cart`);

  const delivery = v.delivery as DeliveryId;
  const payment = v.payment as PaymentId;
  const digits = (v.cardNumber ?? '').replace(/[\s-]/g, '');
  const usesCard = CARD_METHODS.includes(payment);
  if (usesCard && digits.endsWith('0002')) redirect(`/${locale}/checkout/failed?reason=declined`);
  if (usesCard && digits.endsWith('0003')) throw new Error('Payment gateway unavailable');

  const priced = priceItems(cart.items, cart.coupon);
  const order = createOrder({
    status: payment === 'cod' ? 'pending_payment' : 'paid',
    customer: { name: v.fullName.trim(), phone: v.phone.replace(/\s/g, '') },
    address: {
      city: v.city,
      district: v.district.trim(),
      street: v.street.trim(),
      building: v.building,
      notes: (v.notes ?? '').trim(),
    },
    delivery,
    payment,
    cardLast4: usesCard ? digits.slice(-4) : undefined,
    coupon: priced.coupon,
    items: priced.lines.map((l) => ({ productId: l.productId, variant: l.variant, qty: l.qty, unit: l.unit, box: l.box })),
    totals: withFees(priced, delivery, payment),
  });
  cart.items = [];
  cart.coupon = undefined;
  revalidatePath('/', 'layout');
  redirect(`/${locale}/orders/${order.id}`);
}

// ---- contact ----

export type ContactState = { errors: Record<string, string>; ok?: boolean };

export async function contactAction(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const t = await getDictionary(localeOf(fd));
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim();
  const message = String(fd.get('message') ?? '').trim();
  const errors: Record<string, string> = {};
  if (!name) errors.name = t.validation.required;
  if (!email) errors.email = t.validation.required;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t.validation.email;
  if (!message) errors.message = t.validation.required;
  else if (message.length < 10) errors.message = t.validation.messageShort;
  return Object.keys(errors).length ? { errors } : { errors: {}, ok: true };
}

// ---- admin ----

export type StatusState = { error?: string; ok?: number };

export async function updateOrderStatus(_prev: StatusState, fd: FormData): Promise<StatusState> {
  const t = await getDictionary(localeOf(fd));
  const id = String(fd.get('id') ?? '');
  const status = String(fd.get('status') ?? '') as OrderStatus;
  const note = String(fd.get('note') ?? '').trim().slice(0, 200);
  if (!ORDER_STATUSES.includes(status)) return { error: t.validation.required };

  const result = setOrderStatus(id, status, note);
  if (!result.ok) return { error: result.error === 'transition' ? t.admin.errors.transition : t.errors.notFoundTitle };
  revalidatePath(`/${localeOf(fd)}/admin`, 'layout');
  return { ok: Date.now() };
}

// ---- gift box ----

export type GiftState = { errors: Record<string, string>; ok?: number };

export async function addGiftBox(_prev: GiftState, fd: FormData): Promise<GiftState> {
  const locale = localeOf(fd);
  const t = await getDictionary(locale);
  const size = String(fd.get('size') ?? '') as BoxSize;
  if (!(size in BOXES)) return { errors: { size: t.gift.errors.size } };

  let raw: unknown = [];
  try {
    raw = JSON.parse(String(fd.get('items') ?? '[]'));
  } catch {
    // treated as an empty box below
  }
  const rows = (Array.isArray(raw) ? raw : []) as { productId?: unknown; qty?: unknown }[];

  const errors: Record<string, string> = {};
  const items: BoxContent['items'] = [];
  let slots = 0;
  let count = 0;
  for (const row of rows) {
    const product = getProductById(String(row.productId));
    const qty = Math.floor(Number(row.qty));
    if (!product || !BOX_CATEGORIES.includes(product.category) || !(qty > 0)) {
      errors.items = t.gift.errors.invalid;
      break;
    }
    if (product.stock < qty) {
      errors.items = fmt(t.gift.errors.stock, { name: locale === 'ar' ? product.name_ar : product.name_en });
      break;
    }
    items.push({ productId: product.id, qty });
    slots += product.box_slots * qty;
    count += qty;
  }
  if (!errors.items && count < MIN_BOX_ITEMS) errors.items = fmt(t.gift.errors.min, { n: MIN_BOX_ITEMS });
  if (!errors.items && slots > BOXES[size].slots) errors.items = fmt(t.gift.errors.capacity, { n: BOXES[size].slots });

  const message = String(fd.get('message') ?? '').trim();
  if (message.length > MESSAGE_MAX) errors.message = fmt(t.gift.errors.message, { n: MESSAGE_MAX });
  if (Object.keys(errors).length) return { errors };

  const cart = await cartForWrite();
  cart.items.push({
    productId: `box-${randomUUID()}`,
    qty: 1,
    box: { size, items, message: message || undefined, wrap: fd.get('wrap') === 'on' },
  });
  revalidatePath('/', 'layout');
  return { errors: {}, ok: Date.now() };
}

// ---- admin: products ----

export type CellResult = { ok: true; price: number; stock: number } | { ok: false; error: string };

export async function updateProductCell(input: {
  id: string;
  field: 'price' | 'stock';
  value: string;
  locale: string;
}): Promise<CellResult> {
  const t = await getDictionary(isLocale(input.locale) ? input.locale : 'ar');
  const product: Product | undefined = getProductById(input.id);
  if (!product) return { ok: false, error: t.errors.notFoundTitle };

  const value = Number(String(input.value).trim().replace(',', '.'));
  if (input.field === 'price') {
    const cents = value * 100;
    if (!Number.isFinite(value) || value <= 0 || value > 100000 || Math.abs(cents - Math.round(cents)) > 1e-6) {
      return { ok: false, error: t.admin.productsPage.priceError };
    }
    product.price = value;
  } else {
    if (!Number.isInteger(value) || value < 0 || value > 100000) return { ok: false, error: t.admin.productsPage.stockError };
    product.stock = value;
  }
  revalidatePath('/', 'layout');
  return { ok: true, price: product.price, stock: product.stock };
}

export async function markOutOfStock(ids: string[]): Promise<string[]> {
  const done: string[] = [];
  for (const id of ids) {
    const product = products.find((p) => p.id === id);
    if (product) {
      product.stock = 0;
      done.push(id);
    }
  }
  revalidatePath('/', 'layout');
  return done;
}

// ---- admin: settings and roles ----

export type SettingsState = { errors: Record<string, string>; ok?: number; settings?: Settings };

export async function saveSettingsAction(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const t = await getDictionary(localeOf(fd));
  let draft: Partial<Settings> & { shipping?: { fee?: unknown; freeOver?: unknown } } = {};
  try {
    draft = JSON.parse(String(fd.get('payload') ?? '{}'));
  } catch {
    return { errors: { _form: t.validation.required } };
  }

  const errors: Record<string, string> = {};
  const fee = Number(draft.shipping?.fee);
  const freeOver = Number(draft.shipping?.freeOver);
  if (!String(draft.shipping?.fee ?? '').trim() || !Number.isFinite(fee) || fee < 0 || fee > 1000) errors.shippingFee = t.admin.settings.errors.fee;
  if (!String(draft.shipping?.freeOver ?? '').trim() || !Number.isFinite(freeOver) || freeOver < 0 || freeOver > 100000) errors.freeOver = t.admin.settings.errors.freeOver;

  const vatNumber = String(draft.tax?.vatNumber ?? '').trim();
  if (!/^3\d{14}$/.test(vatNumber)) errors.vatNumber = t.admin.settings.errors.vat;

  const open = Boolean(draft.store?.open);
  const closedMessage = String(draft.store?.closedMessage ?? '').trim();
  if (!open && !closedMessage) errors.closedMessage = t.validation.required;
  else if (closedMessage.length > 200) errors.closedMessage = t.admin.settings.errors.messageLong;

  const emails = (Array.isArray(draft.notifications?.emails) ? draft.notifications.emails : []).map((e) => String(e).trim());
  if (emails.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) errors.emails = t.validation.email;
  else if (emails.length > 10) errors.emails = t.admin.settings.errors.emailsMany;

  if (Object.keys(errors).length) return { errors };
  const settings = saveSettings({
    shipping: { fee, freeOver },
    tax: { vatNumber },
    store: { open, closedMessage },
    notifications: { emails },
  });
  revalidatePath('/', 'layout');
  return { errors: {}, ok: Date.now(), settings };
}

export type RolesState = { ok?: number; matrix?: Matrix };

export async function saveRolesAction(_prev: RolesState, fd: FormData): Promise<RolesState> {
  let draft: Partial<Record<string, unknown>> = {};
  try {
    draft = JSON.parse(String(fd.get('payload') ?? '{}'));
  } catch {
    return {};
  }
  const matrix = Object.fromEntries(
    ROLES.map((role) => {
      const list = Array.isArray(draft[role]) ? (draft[role] as unknown[]).map(String) : [];
      return [role, role === 'owner' ? [...ALL_PERMISSIONS] : ALL_PERMISSIONS.filter((p) => list.includes(p))];
    }),
  ) as Matrix;
  saveMatrix(matrix);
  return { ok: Date.now(), matrix: getMatrix() };
}
