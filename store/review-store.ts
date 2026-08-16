import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { reviewRowToReview, type ReviewRow } from '../lib/supabase/mappers';
import type { Review } from '../types';
import { useCreatorStore } from './creator-store';
import { useListingStore } from './listing-store';

interface AddReviewInput {
  orderItemId: string;
  listingId: string;
  creatorId: string;
  buyerId: string;
  rating: number;
  body: string;
}

interface ReviewState {
  reviewsByListing: Record<string, Review[]>;
  myReviewsByOrderItem: Record<string, Review>;
  isLoadingByListing: Record<string, boolean>;
  fetchReviewsForListing: (listingId: string) => Promise<void>;
  fetchMyReviewsForOrder: (buyerId: string, orderItemIds: string[]) => Promise<void>;
  addReview: (input: AddReviewInput) => Promise<{ review: Review | null; error: string | null }>;
  editReview: (
    reviewId: string,
    listingId: string,
    updates: { rating: number; body: string },
  ) => Promise<{ error: string | null }>;
  deleteReview: (reviewId: string, orderItemId: string, listingId: string) => Promise<{ error: string | null }>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviewsByListing: {},
  myReviewsByOrderItem: {},
  isLoadingByListing: {},

  fetchReviewsForListing: async (listingId) => {
    set((state) => ({ isLoadingByListing: { ...state.isLoadingByListing, [listingId]: true } }));
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_buyer_id_fkey(*)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    set((state) => ({ isLoadingByListing: { ...state.isLoadingByListing, [listingId]: false } }));
    if (error || !data) return;

    const rows = data as ReviewRow[];
    const profiles = rows.map((r) => r.profiles).filter((p): p is NonNullable<typeof p> => !!p);
    useCreatorStore.getState().upsertFromRows(profiles);
    set((state) => ({
      reviewsByListing: { ...state.reviewsByListing, [listingId]: rows.map(reviewRowToReview) },
    }));
  },

  fetchMyReviewsForOrder: async (buyerId, orderItemIds) => {
    if (orderItemIds.length === 0) return;
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('buyer_id', buyerId)
      .in('order_item_id', orderItemIds);
    if (error || !data) return;

    const rows = data as ReviewRow[];
    set((state) => {
      const next = { ...state.myReviewsByOrderItem };
      for (const row of rows) {
        next[row.order_item_id] = reviewRowToReview(row);
      }
      return { myReviewsByOrderItem: next };
    });
  },

  addReview: async (input) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        order_item_id: input.orderItemId,
        listing_id: input.listingId,
        creator_id: input.creatorId,
        buyer_id: input.buyerId,
        rating: input.rating,
        body: input.body,
      })
      .select()
      .single();
    if (error || !data) return { review: null, error: error?.message ?? 'Could not submit review.' };

    const review = reviewRowToReview(data as ReviewRow);
    set((state) => ({
      myReviewsByOrderItem: { ...state.myReviewsByOrderItem, [review.orderItemId]: review },
      reviewsByListing: {
        ...state.reviewsByListing,
        [review.listingId]: [review, ...(state.reviewsByListing[review.listingId] ?? [])],
      },
    }));
    useListingStore.getState().fetchById(input.listingId);
    return { review, error: null };
  },

  editReview: async (reviewId, listingId, updates) => {
    const { data, error } = await supabase
      .from('reviews')
      .update({ rating: updates.rating, body: updates.body })
      .eq('id', reviewId)
      .select()
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not update review.' };

    const review = reviewRowToReview(data as ReviewRow);
    set((state) => ({
      myReviewsByOrderItem: { ...state.myReviewsByOrderItem, [review.orderItemId]: review },
      reviewsByListing: {
        ...state.reviewsByListing,
        [listingId]: (state.reviewsByListing[listingId] ?? []).map((r) => (r.id === reviewId ? review : r)),
      },
    }));
    useListingStore.getState().fetchById(listingId);
    return { error: null };
  },

  deleteReview: async (reviewId, orderItemId, listingId) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) return { error: error.message };

    set((state) => {
      const nextMine = { ...state.myReviewsByOrderItem };
      delete nextMine[orderItemId];
      return {
        myReviewsByOrderItem: nextMine,
        reviewsByListing: {
          ...state.reviewsByListing,
          [listingId]: (state.reviewsByListing[listingId] ?? []).filter((r) => r.id !== reviewId),
        },
      };
    });
    useListingStore.getState().fetchById(listingId);
    return { error: null };
  },
}));
