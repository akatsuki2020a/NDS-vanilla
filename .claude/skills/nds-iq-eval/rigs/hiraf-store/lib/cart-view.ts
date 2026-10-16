// Shapes sent to the browser (cart badge, mini cart, /api/cart).
export type CartLineView = {
  key: string;
  slug: string;
  name_ar: string;
  name_en: string;
  image: string;
  variant_ar?: string;
  variant_en?: string;
  qty: number;
  unit: number;
  total: number;
  stock: number;
  /** Set on a gift box line: what is inside. */
  box?: { items: { name_ar: string; name_en: string; qty: number }[]; message?: string; wrap: boolean };
};

export type CartView = { count: number; subtotal: number; lines: CartLineView[] };

export const emptyCartView: CartView = { count: 0, subtotal: 0, lines: [] };
