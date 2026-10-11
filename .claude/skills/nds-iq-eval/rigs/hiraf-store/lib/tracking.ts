import { TRACK_STEPS, type Order, type OrderStatus, type TrackStep } from './store';

export type TrackingPayload = {
  id: string;
  status: OrderStatus;
  delivered: boolean;
  cancelled: boolean;
  courier?: 'safar' | 'durub';
  number?: string;
  eta: string;
  steps: { key: TrackStep; at: string | null }[];
  /** Index of the last step reached. */
  current: number;
};

export function trackingPayload(order: Order): TrackingPayload {
  const { tracking } = order;
  const steps = TRACK_STEPS.map((key) => ({ key, at: tracking.events.find((e) => e.step === key)?.at ?? null }));
  const handed = steps.find((s) => s.key === 'handed_to_courier')?.at;
  return {
    id: order.id,
    status: order.status,
    delivered: order.status === 'delivered',
    cancelled: order.status === 'cancelled',
    courier: handed ? tracking.courier : undefined,
    number: handed ? tracking.number : undefined,
    eta: tracking.eta,
    steps,
    current: steps.reduce((last, s, i) => (s.at ? i : last), 0),
  };
}
