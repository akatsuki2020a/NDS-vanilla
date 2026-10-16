// In-memory carts and orders. Lives as long as the server process; a restart re-seeds.
import { getProduct } from './data';
import { withFees, type DeliveryId, type PaymentId, type Totals } from './fees';
import type { BoxContent } from './gift';
import { priceItems, type Item } from './pricing';

export type Cart = { id: string; items: Item[]; coupon?: string };

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const TRACK_STEPS = ['ordered', 'paid', 'preparing', 'handed_to_courier', 'out_for_delivery', 'delivered'] as const;
export type TrackStep = (typeof TRACK_STEPS)[number];
export type Tracking = {
  courier: 'safar' | 'durub';
  number: string;
  eta: string;
  events: { step: TrackStep; at: string }[];
};

// Last tracking step an order status implies (-1: leave the tracking alone).
const STATUS_STEP: Record<OrderStatus, number> = {
  pending_payment: 0,
  paid: 1,
  preparing: 2,
  shipped: 3,
  delivered: 5,
  cancelled: -1,
};

export type OrderItem = { productId: string; variant?: string; qty: number; unit: number; box?: BoxContent };

export type Order = {
  id: string;
  created: string;
  status: OrderStatus;
  customer: { name: string; phone: string };
  address: { city: string; district: string; street: string; building: string; notes: string };
  delivery: DeliveryId;
  payment: PaymentId;
  cardLast4?: string;
  coupon?: string;
  items: OrderItem[];
  totals: Totals;
  tracking: Tracking;
  history: { status: OrderStatus; at: string; note?: string }[];
};

const HOUR = 3600 * 1000;

// name, phone, city, district, street, building, items [slug, variant, qty][], delivery, payment, status, hours ago, coupon
type Seed = [string, string, string, string, string, string, [string, string | undefined, number][], DeliveryId, PaymentId, OrderStatus, number, string?];

const SEEDS: Seed[] = [
  ['أحمد الغامدي', '0551234501', 'riyadh', 'حي الملقا', 'طريق أنس بن مالك', '4521', [['qassim-sukkari-dates', '1kg', 2], ['saudi-coffee-cardamom', '500g', 1]], 'standard', 'mada', 'pending_payment', 2],
  ['نورة السبيعي', '0561234502', 'jeddah', 'حي الروضة', 'شارع الأمير سلطان', '118', [['sadu-wool-rug', 'm', 1]], 'express', 'card', 'paid', 5, 'WELCOME10'],
  ['محمد القرني', '0501234503', 'dammam', 'حي الشاطئ', 'شارع الخليج', '73', [['royal-bakhoor', '25g', 2]], 'standard', 'cod', 'preparing', 20],
  ['هند العسيري', '0541234504', 'abha', 'حي المنسك', 'شارع الفن', '9', [['madinah-ajwa-dates', '500g', 1], ['almond-stuffed-dates', undefined, 2]], 'standard', 'applepay', 'shipped', 30],
  ['سلطان البلوي', '0591234505', 'tabuk', 'حي الورود', 'شارع الأمير فهد', '260', [['palm-frond-basket', 'l', 2], ['palm-bread-tray', undefined, 1]], 'standard', 'mada', 'delivered', 50],
  ['لمى الشهري', '0581234506', 'riyadh', 'حي النرجس', 'طريق عثمان بن عفان', '3302', [['brass-coffee-dallah', 'm', 1], ['coffee-cup-set', undefined, 1]], 'express', 'card', 'paid', 70],
  ['يوسف الحازمي', '0531234507', 'madinah', 'حي العزيزية', 'شارع قباء', '41', [['cambodian-oud-chips', '3g', 1]], 'express', 'applepay', 'preparing', 100],
  ['مها الرشيدي', '0571234508', 'buraydah', 'حي الإسكان', 'شارع الملك عبدالله', '15', [['pottery-mug-set', undefined, 2], ['decorated-vase', 's', 1]], 'standard', 'cod', 'cancelled', 130],
  ['عمر باوزير', '0561234509', 'jeddah', 'حي السلامة', 'شارع صاري', '502', [['khawlani-coffee-beans', '250g', 3]], 'standard', 'mada', 'delivered', 170, 'FREESHIP'],
  ['جود المالكي', '0551234510', 'makkah', 'حي الشوقية', 'شارع الحج', '87', [['sadu-cushion-cover', undefined, 2], ['sadu-coaster-set', undefined, 1]], 'standard', 'card', 'shipped', 220],
  ['بدر العمري', '0501234511', 'riyadh', 'حي الياسمين', 'طريق الملك فهد', '1290', [['qassim-sukkari-dates', '500g', 4]], 'express', 'mada', 'delivered', 300],
  ['دانة السلمي', '0541234512', 'jeddah', 'حي الحمراء', 'شارع التحلية', '36', [['maamoul-bakhoor', '10g', 1], ['musk-perfume-oil', undefined, 1]], 'standard', 'applepay', 'pending_payment', 400],
  ['ماجد الفيفي', '0591234513', 'abha', 'حي الخالدية', 'شارع المطار', '64', [['sadu-handbag', undefined, 1]], 'standard', 'cod', 'paid', 500],
  ['أريج الجهني', '0581234514', 'dammam', 'حي الفيصلية', 'شارع الأمير محمد', '210', [['clay-cooking-pot', 'm', 1], ['serving-platter', 's', 2]], 'standard', 'mada', 'delivered', 650],
];

const FLOW: OrderStatus[] = ['pending_payment', 'paid', 'preparing', 'shipped', 'delivered'];
const COURIERS: Tracking['courier'][] = ['safar', 'durub'];
const LIVE_ORDER = 'HR-1004';
const LIVE_EVERY = 2 * 60 * 1000;

/** Adds every tracking event up to `index` that is not there yet. */
function reachStep(order: Order, index: number, at: string) {
  TRACK_STEPS.slice(0, index + 1).forEach((step) => {
    if (!order.tracking.events.some((e) => e.step === step)) order.tracking.events.push({ step, at });
  });
}

function newTracking(seq: number, delivery: DeliveryId, created: number): Tracking {
  return {
    courier: COURIERS[seq % 2],
    number: `HRX${String(480000000 + seq * 7919).padStart(9, '0')}`,
    eta: new Date(created + (delivery === 'express' ? 1 : 3) * 24 * HOUR).toISOString(),
    events: [{ step: 'ordered', at: new Date(created).toISOString() }],
  };
}

function seedOrders(): Order[] {
  const now = Date.now();
  return SEEDS.map(([name, phone, city, district, street, building, rows, delivery, payment, status, hoursAgo, coupon], i) => {
    const items: Item[] = rows.map(([slug, variant, qty]) => ({ productId: getProduct(slug)!.id, variant, qty }));
    const priced = priceItems(items, coupon);
    const created = now - hoursAgo * HOUR;
    const reached = status === 'cancelled' ? FLOW.slice(0, 2) : FLOW.slice(0, FLOW.indexOf(status) + 1);
    const history = reached.map((s, k) => ({ status: s, at: new Date(created + k * 6 * HOUR).toISOString() }));
    if (status === 'cancelled') history.push({ status, at: new Date(created + 12 * HOUR).toISOString() });
    const order: Order = {
      id: `HR-${1001 + i}`,
      created: new Date(created).toISOString(),
      status,
      customer: { name, phone },
      address: { city, district, street, building, notes: '' },
      delivery,
      payment,
      cardLast4: payment === 'card' || payment === 'mada' ? '4242' : undefined,
      coupon: priced.coupon,
      items: priced.lines.map((l) => ({ productId: l.productId, variant: l.variant, qty: l.qty, unit: l.unit })),
      totals: withFees(priced, delivery, payment),
      history,
      tracking: newTracking(1001 + i, delivery, created),
    };
    const last = STATUS_STEP[status];
    if (last > 0) {
      TRACK_STEPS.slice(1, last + 1).forEach((step, k) =>
        order.tracking.events.push({ step, at: new Date(created + (k + 1) * 6 * HOUR).toISOString() }),
      );
    }
    return order;
  });
}

type Db = { carts: Map<string, Cart>; orders: Order[]; seq: number; liveAt: number };

function db(): Db {
  const g = globalThis as typeof globalThis & { __hirafStore?: Db };
  g.__hirafStore ??= { carts: new Map(), orders: seedOrders(), seq: 1001 + SEEDS.length, liveAt: Date.now() + LIVE_EVERY };
  const store = g.__hirafStore;
  advanceLiveOrder(store);
  return store;
}

/** The sample in-transit order moves one tracking step every two minutes. */
function advanceLiveOrder(store: Db) {
  const order = store.orders.find((o) => o.id === LIVE_ORDER);
  if (!order || order.status === 'delivered') return;
  while (Date.now() >= store.liveAt && order.status !== 'delivered') {
    const next = TRACK_STEPS[order.tracking.events.length];
    if (!next) break;
    const at = new Date(store.liveAt).toISOString();
    order.tracking.events.push({ step: next, at });
    if (next === 'delivered') {
      order.status = 'delivered';
      order.history.push({ status: 'delivered', at });
    }
    store.liveAt += LIVE_EVERY;
  }
}

export const getCart = (id: string) => db().carts.get(id);

export function saveCart(cart: Cart): Cart {
  db().carts.set(cart.id, cart);
  return cart;
}

export const listOrders = () => [...db().orders].sort((a, b) => b.created.localeCompare(a.created));
export const getOrder = (id: string) => db().orders.find((o) => o.id === id);

export type NewOrder = Omit<Order, 'id' | 'created' | 'history' | 'status' | 'tracking'> & { status: OrderStatus };

export function createOrder(input: NewOrder): Order {
  const store = db();
  const created = Date.now();
  const at = new Date(created).toISOString();
  const seq = store.seq++;
  const order: Order = {
    ...input,
    id: `HR-${seq}`,
    created: at,
    history: [{ status: input.status, at }],
    tracking: newTracking(seq, input.delivery, created),
  };
  if (STATUS_STEP[input.status] > 0) reachStep(order, STATUS_STEP[input.status], at);
  store.orders.push(order);
  return order;
}

export function setOrderStatus(
  id: string,
  to: OrderStatus,
  note?: string,
): { ok: true } | { ok: false; error: 'not_found' | 'transition' } {
  const order = getOrder(id);
  if (!order) return { ok: false, error: 'not_found' };
  if (!TRANSITIONS[order.status].includes(to)) return { ok: false, error: 'transition' };
  const at = new Date().toISOString();
  order.status = to;
  order.history.push({ status: to, at, note: note || undefined });
  if (STATUS_STEP[to] >= 0) reachStep(order, STATUS_STEP[to], at);
  return { ok: true };
}
