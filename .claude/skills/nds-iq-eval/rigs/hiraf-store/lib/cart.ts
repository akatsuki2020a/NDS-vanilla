import { cookies } from 'next/headers';
import { getCart } from './store';
import { priceItems, toView } from './pricing';

export async function readCart() {
  const id = (await cookies()).get('cart_id')?.value;
  return id ? getCart(id) : undefined;
}

export async function readPricedCart() {
  const cart = await readCart();
  return priceItems(cart?.items ?? [], cart?.coupon);
}

export async function readCartView() {
  return toView(await readPricedCart());
}
