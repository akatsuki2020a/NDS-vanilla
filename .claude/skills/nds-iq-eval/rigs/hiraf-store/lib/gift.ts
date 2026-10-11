import type { Locale } from './i18n';

// Gift box rules. Pure, so the builder in the browser and the server action share them.
export const BOXES = {
  S: { slots: 4, price: 35 },
  M: { slots: 8, price: 55 },
  L: { slots: 12, price: 75 },
} as const;
export type BoxSize = keyof typeof BOXES;
export const BOX_SIZES = Object.keys(BOXES) as BoxSize[];

export const WRAP_FEE = 15;
export const MESSAGE_MAX = 150;
export const MIN_BOX_ITEMS = 2;
export const BOX_CATEGORIES = ['dates', 'coffee', 'incense'];
export const BOX_IMAGE = '/products/gift-box.svg';

export type BoxContent = {
  size: BoxSize;
  items: { productId: string; qty: number }[];
  message?: string;
  wrap: boolean;
};

export const boxName = (size: BoxSize, locale: Locale) => (locale === 'ar' ? `صندوق هدايا (${size})` : `Gift box (${size})`);
