import type { OrderStatus } from './store';

// Chip colour per order status.
export const STATUS_COLORS: Record<OrderStatus, 'default' | 'warning' | 'info' | 'primary' | 'secondary' | 'success' | 'error'> = {
  pending_payment: 'warning',
  paid: 'info',
  preparing: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'error',
};
