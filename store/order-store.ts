import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { orderRowToOrder, type OrderRow } from '../lib/supabase/mappers';
import type { Address, Order, OrderItem, PaymentMethod } from '../types';

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
  getDigitalDownloadUrl: (listingId: string) => Promise<string | null>;
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
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        subtotal: input.subtotal,
        shipping_fee: input.shippingFee,
        total: input.total,
        payment_method: input.paymentMethod,
        payment_proof_path: input.paymentProofPath,
        address: input.address,
      })
      .select()
      .single();
    if (orderError || !orderData) {
      return { order: null, error: orderError?.message ?? 'Could not place order.' };
    }

    const orderRow = orderData as OrderRow;

    const { error: itemsError } = await supabase.from('order_items').insert(
      input.items.map((item) => ({
        order_id: orderRow.id,
        listing_id: item.listingId,
        title: item.title,
        cover_url: item.coverUrl,
        price: item.price,
        quantity: item.quantity,
        product_type: item.productType,
      })),
    );
    if (itemsError) return { order: null, error: itemsError.message };

    const { data: fullOrderData, error: fetchError } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderRow.id)
      .single();
    if (fetchError || !fullOrderData) {
      return { order: null, error: 'Order was placed but could not be reloaded.' };
    }

    const order = orderRowToOrder(fullOrderData as OrderRow);
    set((state) => ({ orders: [order, ...state.orders] }));
    return { order, error: null };
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
}));
