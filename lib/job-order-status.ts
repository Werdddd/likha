import { colors } from '../constants/theme';
import type { JobOrderStatus } from '../types';

// 'revision' is a sub-state of "In Progress" (the buyer asked for changes while the creator is
// still working) rather than its own timeline node, so the visible pipeline stays a straight
// 4-step line like the Shop order timeline.
export const JOB_ORDER_STATUS_STEPS: Array<{ status: JobOrderStatus; label: string }> = [
  { status: 'deposit_pending', label: 'Deposit' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'completed', label: 'Completed' },
];

const TIMELINE_INDEX: Partial<Record<JobOrderStatus, number>> = {
  deposit_pending: 0,
  in_progress: 1,
  revision: 1,
  delivered: 2,
  completed: 3,
};

export function isTerminalJobOrderStatus(status: JobOrderStatus): boolean {
  return status === 'cancelled' || status === 'completed';
}

const STATUS_LABELS: Record<JobOrderStatus, string> = {
  deposit_pending: 'Awaiting Deposit',
  in_progress: 'In Progress',
  revision: 'Revision Requested',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function jobOrderStatusLabel(status: JobOrderStatus): string {
  return STATUS_LABELS[status];
}

export function jobOrderTimelineIndex(status: JobOrderStatus): number {
  return TIMELINE_INDEX[status] ?? -1;
}

export function canRequestRevision(status: JobOrderStatus): boolean {
  return status === 'in_progress' || status === 'delivered';
}

export function nextJobOrderStatus(status: JobOrderStatus): JobOrderStatus | null {
  switch (status) {
    case 'in_progress':
    case 'revision':
      return 'delivered';
    default:
      return null;
  }
}

export function jobOrderStatusColor(status: JobOrderStatus): { bg: string; fg: string } {
  switch (status) {
    case 'completed':
      return { bg: colors.likhaYellow + '33', fg: colors.golden };
    case 'cancelled':
      return { bg: colors.terracotta + '1a', fg: colors.terracotta };
    case 'revision':
      return { bg: colors.terracotta + '1a', fg: colors.terracotta };
    default:
      return { bg: colors.softGray + '80', fg: colors.ink };
  }
}
