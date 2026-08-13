import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CartLine } from '../types';
import { useListingStore } from './listing-store';
import { useSessionStore } from './session-store';

interface CartState {
  items: CartLine[];
  addItem: (listingId: string, quantity?: number) => { error: string | null };
  removeItem: (listingId: string) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (listingId, quantity = 1) => {
        const listing = useListingStore.getState().listingsById[listingId];
        const currentUserId = useSessionStore.getState().currentUser.id;
        if (listing && currentUserId && listing.creatorId === currentUserId) {
          return { error: "You can't buy your own listing." };
        }

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
        });
        return { error: null };
      },
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
    }),
    {
      name: 'likha-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
