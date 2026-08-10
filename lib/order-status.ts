import type { OrderStatus } from '../types';

const SHIPPED_AFTER_MS = 20_000;
const DELIVERED_AFTER_MS = 90_000;

/** No backend exists to advance order state, so status is derived from time elapsed since placement. */
export function getOrderStatus(createdAt: string): OrderStatus {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  if (elapsed >= DELIVERED_AFTER_MS) return 'delivered';
  if (elapsed >= SHIPPED_AFTER_MS) return 'shipped';
  return 'processing';
}

export const ORDER_STATUS_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
];

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_STEPS.find((step) => step.status === status)?.label ?? status;
}
