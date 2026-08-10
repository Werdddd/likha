import { create } from 'zustand';

import type { Order } from '../types';

interface OrderState {
  orders: Order[];
  placeOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  placeOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
}));
