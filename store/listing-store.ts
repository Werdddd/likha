import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { listingRowToListing, type ListingRow, type ProfileRow } from '../lib/supabase/mappers';
import type { Listing, ProductCategory, ProductType } from '../types';
import { useCreatorStore } from './creator-store';

const LISTING_SELECT = '*, profiles!listings_creator_id_fkey(*), listing_images(*), listing_links(*)';

interface ListingLinkInput {
  label: string;
  url: string;
}

interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  productType: ProductType;
  category: ProductCategory;
  tags: string[];
  stock: number | null;
  projectId?: string;
  imageUrls: string[];
  digitalFilePath?: string;
  digitalFileName?: string;
  links: ListingLinkInput[];
}

interface UpdateListingInput {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  tags: string[];
  stock: number | null;
  projectId?: string;
  imageUrls: string[];
  digitalFilePath?: string;
  digitalFileName?: string;
  links: ListingLinkInput[];
}

interface ListingState {
  listingsById: Record<string, Listing>;
  isLoadingFeed: boolean;
  fetchFeed: () => Promise<void>;
  fetchByCreator: (creatorId: string) => Promise<Listing[]>;
  fetchMyListings: (creatorId: string) => Promise<Listing[]>;
  fetchById: (id: string) => Promise<Listing | null>;
  /** Admin-only: every listing currently hidden (moderation_status = 'rejected'). */
  fetchHiddenListings: () => Promise<Listing[]>;
  /** Admin-only: hide or restore any listing, with an optional note delivered to the owner. */
  moderateListing: (
    id: string,
    action: 'hide' | 'restore',
    note?: string,
  ) => Promise<{ error: string | null }>;
  /** Admin-only: permanently remove someone else's listing, with an optional note. */
  adminDeleteListing: (id: string, note?: string) => Promise<{ error: string | null }>;
  createListing: (
    creatorId: string,
    input: CreateListingInput,
  ) => Promise<{ listing: Listing | null; error: string | null }>;
  updateListing: (
    listingId: string,
    input: UpdateListingInput,
  ) => Promise<{ listing: Listing | null; error: string | null }>;
  setListingActive: (listingId: string, isActive: boolean) => Promise<{ error: string | null }>;
  /** Delete your own listing. */
  deleteListing: (listingId: string) => Promise<{ error: string | null }>;
}

export const useListingStore = create<ListingState>((set, get) => {
  const upsertRows = (rows: ListingRow[]) => {
    const profiles = rows.map((r) => r.profiles).filter((p): p is ProfileRow => !!p);
    useCreatorStore.getState().upsertFromRows(profiles);

    set((state) => {
      const next = { ...state.listingsById };
      for (const row of rows) {
        next[row.id] = listingRowToListing(row);
      }
      return { listingsById: next };
    });
  };

  return {
    listingsById: {},
    isLoadingFeed: false,

    fetchFeed: async () => {
      set({ isLoadingFeed: true });
      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      set({ isLoadingFeed: false });
      if (error || !data) return;
      upsertRows(data as ListingRow[]);
    },

    // Public view of a creator's shop (their profile's Shop tab, etc.) — active listings only.
    fetchByCreator: async (creatorId) => {
      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      const rows = data as ListingRow[];
      upsertRows(rows);
      return rows.map(listingRowToListing);
    },

    // Seller's own management view — includes deactivated listings (RLS only allows this for
    // the owner; other users' inactive listings stay invisible).
    fetchMyListings: async (creatorId) => {
      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      const rows = data as ListingRow[];
      upsertRows(rows);
      return rows.map(listingRowToListing);
    },

    fetchById: async (id) => {
      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as ListingRow;
      upsertRows([row]);
      return listingRowToListing(row);
    },

    fetchHiddenListings: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('moderation_status', 'rejected')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      const rows = data as ListingRow[];
      upsertRows(rows);
      return rows.map(listingRowToListing);
    },

    moderateListing: async (id, action, note) => {
      const { data, error } = await supabase.rpc('moderate_listing', {
        p_listing_id: id,
        p_action: action,
        p_note: note ?? null,
      });
      if (error) return { error: error.message };
      if (data) upsertRows([data as ListingRow]);
      return { error: null };
    },

    adminDeleteListing: async (id, note) => {
      const { error } = await supabase.rpc('admin_delete_listing', {
        p_listing_id: id,
        p_note: note ?? null,
      });
      if (error) return { error: error.message };
      set((state) => {
        const next = { ...state.listingsById };
        delete next[id];
        return { listingsById: next };
      });
      return { error: null };
    },

    createListing: async (creatorId, input) => {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .insert({
          creator_id: creatorId,
          project_id: input.projectId ?? null,
          title: input.title,
          description: input.description,
          price: input.price,
          product_type: input.productType,
          category: input.category,
          tags: input.tags,
          stock: input.stock,
          digital_file_path: input.digitalFilePath ?? null,
          digital_file_name: input.digitalFileName ?? null,
          cover_url: input.imageUrls[0] ?? null,
        })
        .select()
        .single();
      if (listingError || !listingData) {
        return { listing: null, error: listingError?.message ?? 'Could not create listing.' };
      }

      const listingRow = listingData as ListingRow;

      if (input.imageUrls.length > 0) {
        const { error: imagesError } = await supabase.from('listing_images').insert(
          input.imageUrls.map((url, index) => ({
            listing_id: listingRow.id,
            url,
            position: index,
          })),
        );
        if (imagesError) return { listing: null, error: imagesError.message };
      }

      if (input.links.length > 0) {
        const { error: linksError } = await supabase.from('listing_links').insert(
          input.links.map((link, index) => ({
            listing_id: listingRow.id,
            label: link.label,
            url: link.url,
            position: index,
          })),
        );
        if (linksError) return { listing: null, error: linksError.message };
      }

      const listing = await get().fetchById(listingRow.id);
      return { listing, error: listing ? null : 'Listing was created but could not be reloaded.' };
    },

    updateListing: async (listingId, input) => {
      const row: Record<string, unknown> = {
        project_id: input.projectId ?? null,
        title: input.title,
        description: input.description,
        price: input.price,
        category: input.category,
        tags: input.tags,
        stock: input.stock,
        digital_file_path: input.digitalFilePath ?? null,
        digital_file_name: input.digitalFileName ?? null,
        cover_url: input.imageUrls[0] ?? null,
      };

      const { error: listingError } = await supabase.from('listings').update(row).eq('id', listingId);
      if (listingError) return { listing: null, error: listingError.message };

      const { error: deleteImagesError } = await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', listingId);
      if (deleteImagesError) return { listing: null, error: deleteImagesError.message };

      if (input.imageUrls.length > 0) {
        const { error: imagesError } = await supabase.from('listing_images').insert(
          input.imageUrls.map((url, index) => ({
            listing_id: listingId,
            url,
            position: index,
          })),
        );
        if (imagesError) return { listing: null, error: imagesError.message };
      }

      const { error: deleteLinksError } = await supabase.from('listing_links').delete().eq('listing_id', listingId);
      if (deleteLinksError) return { listing: null, error: deleteLinksError.message };

      if (input.links.length > 0) {
        const { error: linksError } = await supabase.from('listing_links').insert(
          input.links.map((link, index) => ({
            listing_id: listingId,
            label: link.label,
            url: link.url,
            position: index,
          })),
        );
        if (linksError) return { listing: null, error: linksError.message };
      }

      const listing = await get().fetchById(listingId);
      return { listing, error: listing ? null : 'Listing was updated but could not be reloaded.' };
    },

    setListingActive: async (listingId, isActive) => {
      const { data, error } = await supabase
        .from('listings')
        .update({ is_active: isActive })
        .eq('id', listingId)
        .select(LISTING_SELECT)
        .single();
      if (error || !data) return { error: error?.message ?? 'Could not update listing.' };
      upsertRows([data as ListingRow]);
      return { error: null };
    },

    deleteListing: async (listingId) => {
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) return { error: error.message };
      set((state) => {
        const next = { ...state.listingsById };
        delete next[listingId];
        return { listingsById: next };
      });
      return { error: null };
    },
  };
});
