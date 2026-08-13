import { colors } from '../constants/theme';
import type { OrderItem, OrderStatus } from '../types';

export const ORDER_STATUS_STEPS_PHYSICAL: Array<{ status: OrderStatus; label: string }> = [
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
];

// Digital items never ship, so the fulfillment flow skips straight to a "Completed" step.
export const ORDER_STATUS_STEPS_DIGITAL: Array<{ status: OrderStatus; label: string }> = [
  { status: 'processing', label: 'Processing' },
  { status: 'delivered', label: 'Completed' },
];

export function orderHasPhysicalItems(items: Pick<OrderItem, 'productType'>[]): boolean {
  return items.some((item) => item.productType === 'physical');
}

export function getOrderStatusSteps(hasPhysicalItems: boolean) {
  return hasPhysicalItems ? ORDER_STATUS_STEPS_PHYSICAL : ORDER_STATUS_STEPS_DIGITAL;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'cancelled' || status === 'rejected';
}

const TERMINAL_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export function orderStatusLabel(status: OrderStatus, hasPhysicalItems = true): string {
  const terminalLabel = TERMINAL_STATUS_LABELS[status];
  if (terminalLabel) return terminalLabel;
  return getOrderStatusSteps(hasPhysicalItems).find((step) => step.status === status)?.label ?? status;
}

export function nextOrderStatus(status: OrderStatus, hasPhysicalItems = true): OrderStatus | null {
  const steps = getOrderStatusSteps(hasPhysicalItems);
  const index = steps.findIndex((step) => step.status === status);
  if (index === -1 || index === steps.length - 1) return null;
  return steps[index + 1].status;
}

export function canRejectOrder(status: OrderStatus): boolean {
  return status === 'processing';
}

export function orderStatusColor(status: OrderStatus): { bg: string; fg: string } {
  switch (status) {
    case 'delivered':
      return { bg: colors.likhaYellow + '33', fg: colors.golden };
    case 'cancelled':
    case 'rejected':
      return { bg: colors.terracotta + '1a', fg: colors.terracotta };
    default:
      return { bg: colors.softGray + '80', fg: colors.ink };
  }
}
