import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { orderRowToOrder, type OrderRow } from '../lib/supabase/mappers';
import type { Address, ListingLink, Order, OrderItem, PaymentMethod } from '../types';

const ORDER_SELECT = '*, order_items(*)';

interface PlaceOrderInput {
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: Address | null;
  paymentMethod: PaymentMethod;
  paymentProofPath: string;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  placeOrder: (
    buyerId: string,
    input: PlaceOrderInput,
  ) => Promise<{ order: Order | null; error: string | null }>;
  cancelOrder: (orderId: string) => Promise<{ error: string | null }>;
  getDigitalDownloadUrl: (listingId: string) => Promise<string | null>;
  getDigitalLinks: (listingId: string) => Promise<ListingLink[]>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false });
    set({ isLoading: false });
    if (error || !data) return;
    set({ orders: (data as OrderRow[]).map(orderRowToOrder) });
  },

  placeOrder: async (buyerId, input) => {
    const { data: placedOrder, error: placeError } = await supabase.rpc('place_order', {
      p_subtotal: input.subtotal,
      p_shipping_fee: input.shippingFee,
      p_total: input.total,
      p_payment_method: input.paymentMethod,
      p_payment_proof_path: input.paymentProofPath,
      p_address: input.address,
      p_items: input.items.map((item) => ({
        listing_id: item.listingId,
        title: item.title,
        cover_url: item.coverUrl,
        price: item.price,
        quantity: item.quantity,
        product_type: item.productType,
      })),
    });
    if (placeError || !placedOrder) {
      return { order: null, error: placeError?.message ?? 'Could not place order.' };
    }

    const orderId = (placedOrder as OrderRow).id;

    const { data: fullOrderData, error: fetchError } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderId)
      .single();
    if (fetchError || !fullOrderData) {
      return { order: null, error: 'Order was placed but could not be reloaded.' };
    }

    const order = orderRowToOrder(fullOrderData as OrderRow);
    set((state) => ({ orders: [order, ...state.orders] }));
    return { order, error: null };
  },

  cancelOrder: async (orderId) => {
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) return { error: error.message };

    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)),
    }));
    return { error: null };
  },

  getDigitalDownloadUrl: async (listingId) => {
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('digital_file_path')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError || !listingData?.digital_file_path) return null;

    const { data, error } = await supabase.storage
      .from('digital-files')
      .createSignedUrl(listingData.digital_file_path, 60 * 10);
    if (error || !data) return null;
    return data.signedUrl;
  },

  getDigitalLinks: async (listingId) => {
    const { data, error } = await supabase
      .from('listing_links')
      .select('id, label, url')
      .eq('listing_id', listingId)
      .order('position', { ascending: true });
    if (error || !data) return [];
    return data as ListingLink[];
  },
}));
