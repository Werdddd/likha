import { create } from 'zustand';

import type { CartLine } from '../types';

interface CartState {
  items: CartLine[];
  addItem: (listingId: string, quantity?: number) => void;
  removeItem: (listingId: string) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (listingId, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((item) => item.listingId === listingId);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.listingId === listingId ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        };
      }
      return { items: [...state.items, { listingId, quantity }] };
    }),
  removeItem: (listingId) =>
    set((state) => ({ items: state.items.filter((item) => item.listingId !== listingId) })),
  setQuantity: (listingId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((item) => item.listingId !== listingId)
          : state.items.map((item) => (item.listingId === listingId ? { ...item, quantity } : item)),
    })),
  clear: () => set({ items: [] }),
}));
