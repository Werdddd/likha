import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import {
  creatorOrderItemRowsToCreatorOrders,
  type CreatorOrderItemRow,
} from '../lib/supabase/mappers';
import type { CreatorOrder, DashboardStats, OrderStatus, TopListing } from '../types';

const CREATOR_ORDER_ITEM_SELECT =
  '*, orders!inner(id, status, address, payment_method, payment_proof_path, payment_verified, created_at), listings!inner(creator_id)';

function computeStats(orders: CreatorOrder[], listingsCount: number): DashboardStats {
  // Cancelled orders never generate revenue for the creator.
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  let revenue = 0;
  let itemsSold = 0;
  const byListing = new Map<string, TopListing>();

  for (const order of activeOrders) {
    for (const item of order.items) {
      const lineTotal = item.price * item.quantity;
      revenue += lineTotal;
      itemsSold += item.quantity;

      const key = item.listingId || item.title;
      const existing = byListing.get(key);
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenue += lineTotal;
      } else {
        byListing.set(key, {
          listingId: item.listingId,
          title: item.title,
          coverUrl: item.coverUrl,
          unitsSold: item.quantity,
          revenue: lineTotal,
        });
      }
    }
  }

  const topListings = Array.from(byListing.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    revenue,
    ordersCount: activeOrders.length,
    itemsSold,
    listingsCount,
    topListings,
  };
}

interface DashboardState {
  orders: CreatorOrder[];
  stats: DashboardStats | null;
  isLoading: boolean;
  fetchDashboard: (creatorId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ error: string | null }>;
  verifyPayment: (orderId: string) => Promise<{ error: string | null }>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  orders: [],
  stats: null,
  isLoading: false,

  fetchDashboard: async (creatorId) => {
    set({ isLoading: true });

    const [itemsResult, listingsResult] = await Promise.all([
      supabase
        .from('order_items')
        .select(CREATOR_ORDER_ITEM_SELECT)
        .eq('listings.creator_id', creatorId)
        .order('created_at', { ascending: false }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('creator_id', creatorId),
    ]);

    set({ isLoading: false });

    if (itemsResult.error || !itemsResult.data) return;

    const orders = creatorOrderItemRowsToCreatorOrders(itemsResult.data as CreatorOrderItemRow[]);
    const listingsCount = listingsResult.count ?? 0;
    set({ orders, stats: computeStats(orders, listingsCount) });
  },

  updateOrderStatus: async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) return { error: error.message };

    set((state) => {
      const orders = state.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      return { orders, stats: state.stats ? computeStats(orders, state.stats.listingsCount) : state.stats };
    });
    return { error: null };
  },

  verifyPayment: async (orderId) => {
    const { error } = await supabase.from('orders').update({ payment_verified: true }).eq('id', orderId);
    if (error) return { error: error.message };

    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, paymentVerified: true } : o)),
    }));
    return { error: null };
  },
}));
