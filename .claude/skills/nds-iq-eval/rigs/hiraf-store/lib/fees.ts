// Pure fee rules, shared by the server actions and the checkout summary.
export type DeliveryId = 'standard' | 'express';
export type PaymentId = 'mada' | 'card' | 'applepay' | 'cod';

export const DELIVERY_FEES: Record<DeliveryId, number> = { standard: 0, express: 35 };
export const PAYMENT_FEES: Record<PaymentId, number> = { mada: 0, card: 0, applepay: 0, cod: 10 };
export const VAT_RATE = 0.15;

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Prices include VAT, so the VAT part of a gross total is total * rate / (1 + rate). */
export const vatOf = (gross: number) => round2((gross * VAT_RATE) / (1 + VAT_RATE));

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  fees: number;
  vat: number;
  total: number;
};

export function withFees(
  base: { subtotal: number; discount: number; shipping: number },
  delivery: DeliveryId,
  payment: PaymentId,
): Totals {
  const fees = DELIVERY_FEES[delivery] + PAYMENT_FEES[payment];
  const total = round2(base.subtotal - base.discount + base.shipping + fees);
  return { ...base, fees, vat: vatOf(total), total };
}
