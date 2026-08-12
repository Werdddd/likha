import type { OrderStatus } from '../types';

export const ORDER_STATUS_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
];

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_STEPS.find((step) => step.status === status)?.label ?? status;
}
