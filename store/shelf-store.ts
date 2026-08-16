import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { shelfRowToShelf, type ShelfRow } from '../lib/supabase/mappers';
import type { Shelf } from '../types';
import { useListingStore } from './listing-store';
import { useProjectStore } from './project-store';

interface ShelfState {
  shelvesById: Record<string, Shelf>;
  /** Number of the current user's shelves each listing/project appears on -- drives the
   *  filled/unfilled bookmark icon on cards. A count (not a flag) so removing from one shelf
   *  doesn't wrongly clear the icon while the item is still saved on another. */
  savedListingIds: Record<string, number>;
  savedProjectIds: Record<string, number>;
  /** Ordered content ids per shelf, populated on demand when a shelf is opened. */
  listingIdsByShelf: Record<string, string[]>;
  projectIdsByShelf: Record<string, string[]>;
  /** Listings and projects on a shelf interleaved by save time (most recent first) --
   *  used for the mixed-media bento preview on the profile screen. */
  itemOrderByShelf: Record<string, Array<{ type: 'listing' | 'project'; id: string }>>;

  fetchMyShelves: (ownerId: string) => Promise<Shelf[]>;
  /** Populates savedListingIds/savedProjectIds for the bookmark icon across the whole app. */
  fetchSavedStatus: (ownerId: string) => Promise<void>;
  createShelf: (ownerId: string, name: string) => Promise<{ shelf: Shelf | null; error: string | null }>;
  renameShelf: (shelfId: string, name: string) => Promise<{ error: string | null }>;
  deleteShelf: (shelfId: string) => Promise<{ error: string | null }>;

  fetchShelfItems: (shelfId: string) => Promise<void>;
  /** Which of the owner's shelves currently contain this listing/project -- used by the save sheet. */
  fetchShelvesContainingListing: (listingId: string) => Promise<Set<string>>;
  fetchShelvesContainingProject: (projectId: string) => Promise<Set<string>>;

  saveListingToShelf: (shelfId: string, listingId: string) => Promise<{ error: string | null }>;
  removeListingFromShelf: (shelfId: string, listingId: string) => Promise<{ error: string | null }>;
  saveProjectToShelf: (shelfId: string, projectId: string) => Promise<{ error: string | null }>;
  removeProjectFromShelf: (shelfId: string, projectId: string) => Promise<{ error: string | null }>;
}

export const useShelfStore = create<ShelfState>((set) => ({
  shelvesById: {},
  savedListingIds: {},
  savedProjectIds: {},
  listingIdsByShelf: {},
  projectIdsByShelf: {},
  itemOrderByShelf: {},

  fetchMyShelves: async (ownerId) => {
    const { data, error } = await supabase
      .from('shelves')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    const shelves = (data as ShelfRow[]).map(shelfRowToShelf);
    set((state) => {
      const next = { ...state.shelvesById };
      for (const shelf of shelves) next[shelf.id] = shelf;
      return { shelvesById: next };
    });
    return shelves;
  },

  fetchSavedStatus: async (ownerId) => {
    const [listingsRes, projectsRes] = await Promise.all([
      supabase.from('shelf_listings').select('listing_id, shelves!inner(owner_id)').eq('shelves.owner_id', ownerId),
      supabase.from('shelf_projects').select('project_id, shelves!inner(owner_id)').eq('shelves.owner_id', ownerId),
    ]);

    const savedListingIds: Record<string, number> = {};
    for (const row of (listingsRes.data ?? []) as { listing_id: string }[]) {
      savedListingIds[row.listing_id] = (savedListingIds[row.listing_id] ?? 0) + 1;
    }
    const savedProjectIds: Record<string, number> = {};
    for (const row of (projectsRes.data ?? []) as { project_id: string }[]) {
      savedProjectIds[row.project_id] = (savedProjectIds[row.project_id] ?? 0) + 1;
    }
    set({ savedListingIds, savedProjectIds });
  },

  createShelf: async (ownerId, name) => {
    const { data, error } = await supabase
      .from('shelves')
      .insert({ owner_id: ownerId, name })
      .select()
      .single();
    if (error || !data) return { shelf: null, error: error?.message ?? 'Could not create shelf.' };
    const shelf = shelfRowToShelf(data as ShelfRow);
    set((state) => ({ shelvesById: { ...state.shelvesById, [shelf.id]: shelf } }));
    return { shelf, error: null };
  },

  renameShelf: async (shelfId, name) => {
    const { error } = await supabase.from('shelves').update({ name }).eq('id', shelfId);
    if (error) return { error: error.message };
    set((state) => {
      const shelf = state.shelvesById[shelfId];
      if (!shelf) return {};
      return { shelvesById: { ...state.shelvesById, [shelfId]: { ...shelf, name } } };
    });
    return { error: null };
  },

  deleteShelf: async (shelfId) => {
    const { error } = await supabase.from('shelves').delete().eq('id', shelfId);
    if (error) return { error: error.message };
    set((state) => {
      const next = { ...state.shelvesById };
      delete next[shelfId];
      return { shelvesById: next };
    });
    return { error: null };
  },

  fetchShelfItems: async (shelfId) => {
    const [listingsRes, projectsRes] = await Promise.all([
      supabase
        .from('shelf_listings')
        .select('listing_id, created_at')
        .eq('shelf_id', shelfId)
        .order('created_at', { ascending: false }),
      supabase
        .from('shelf_projects')
        .select('project_id, created_at')
        .eq('shelf_id', shelfId)
        .order('created_at', { ascending: false }),
    ]);

    const listingRows = (listingsRes.data ?? []) as { listing_id: string; created_at: string }[];
    const projectRows = (projectsRes.data ?? []) as { project_id: string; created_at: string }[];
    const listingIds = listingRows.map((r) => r.listing_id);
    const projectIds = projectRows.map((r) => r.project_id);

    const itemOrder = [
      ...listingRows.map((r) => ({ type: 'listing' as const, id: r.listing_id, createdAt: r.created_at })),
      ...projectRows.map((r) => ({ type: 'project' as const, id: r.project_id, createdAt: r.created_at })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ type, id }) => ({ type, id }));

    set((state) => ({
      listingIdsByShelf: { ...state.listingIdsByShelf, [shelfId]: listingIds },
      projectIdsByShelf: { ...state.projectIdsByShelf, [shelfId]: projectIds },
      itemOrderByShelf: { ...state.itemOrderByShelf, [shelfId]: itemOrder },
    }));

    const fetchListingById = useListingStore.getState().fetchById;
    const fetchProjectById = useProjectStore.getState().fetchById;
    await Promise.all([...listingIds.map(fetchListingById), ...projectIds.map(fetchProjectById)]);
  },

  fetchShelvesContainingListing: async (listingId) => {
    const { data } = await supabase.from('shelf_listings').select('shelf_id').eq('listing_id', listingId);
    return new Set(((data ?? []) as { shelf_id: string }[]).map((r) => r.shelf_id));
  },

  fetchShelvesContainingProject: async (projectId) => {
    const { data } = await supabase.from('shelf_projects').select('shelf_id').eq('project_id', projectId);
    return new Set(((data ?? []) as { shelf_id: string }[]).map((r) => r.shelf_id));
  },

  saveListingToShelf: async (shelfId, listingId) => {
    const { error } = await supabase.from('shelf_listings').insert({ shelf_id: shelfId, listing_id: listingId });
    if (error) return { error: error.message };
    set((state) => {
      const shelf = state.shelvesById[shelfId];
      return {
        savedListingIds: { ...state.savedListingIds, [listingId]: (state.savedListingIds[listingId] ?? 0) + 1 },
        shelvesById: shelf
          ? { ...state.shelvesById, [shelfId]: { ...shelf, itemCount: shelf.itemCount + 1 } }
          : state.shelvesById,
      };
    });
    return { error: null };
  },

  removeListingFromShelf: async (shelfId, listingId) => {
    const { error } = await supabase
      .from('shelf_listings')
      .delete()
      .eq('shelf_id', shelfId)
      .eq('listing_id', listingId);
    if (error) return { error: error.message };
    set((state) => {
      const shelf = state.shelvesById[shelfId];
      const nextListingIdsByShelf = { ...state.listingIdsByShelf };
      if (nextListingIdsByShelf[shelfId]) {
        nextListingIdsByShelf[shelfId] = nextListingIdsByShelf[shelfId].filter((id) => id !== listingId);
      }
      const nextSavedListingIds = { ...state.savedListingIds };
      const remaining = Math.max((nextSavedListingIds[listingId] ?? 1) - 1, 0);
      if (remaining === 0) delete nextSavedListingIds[listingId];
      else nextSavedListingIds[listingId] = remaining;
      return {
        listingIdsByShelf: nextListingIdsByShelf,
        savedListingIds: nextSavedListingIds,
        shelvesById: shelf
          ? { ...state.shelvesById, [shelfId]: { ...shelf, itemCount: Math.max(shelf.itemCount - 1, 0) } }
          : state.shelvesById,
      };
    });
    return { error: null };
  },

  saveProjectToShelf: async (shelfId, projectId) => {
    const { error } = await supabase.from('shelf_projects').insert({ shelf_id: shelfId, project_id: projectId });
    if (error) return { error: error.message };
    set((state) => {
      const shelf = state.shelvesById[shelfId];
      return {
        savedProjectIds: { ...state.savedProjectIds, [projectId]: (state.savedProjectIds[projectId] ?? 0) + 1 },
        shelvesById: shelf
          ? { ...state.shelvesById, [shelfId]: { ...shelf, itemCount: shelf.itemCount + 1 } }
          : state.shelvesById,
      };
    });
    return { error: null };
  },

  removeProjectFromShelf: async (shelfId, projectId) => {
    const { error } = await supabase
      .from('shelf_projects')
      .delete()
      .eq('shelf_id', shelfId)
      .eq('project_id', projectId);
    if (error) return { error: error.message };
    set((state) => {
      const shelf = state.shelvesById[shelfId];
      const nextProjectIdsByShelf = { ...state.projectIdsByShelf };
      if (nextProjectIdsByShelf[shelfId]) {
        nextProjectIdsByShelf[shelfId] = nextProjectIdsByShelf[shelfId].filter((id) => id !== projectId);
      }
      const nextSavedProjectIds = { ...state.savedProjectIds };
      const remaining = Math.max((nextSavedProjectIds[projectId] ?? 1) - 1, 0);
      if (remaining === 0) delete nextSavedProjectIds[projectId];
      else nextSavedProjectIds[projectId] = remaining;
      return {
        projectIdsByShelf: nextProjectIdsByShelf,
        savedProjectIds: nextSavedProjectIds,
        shelvesById: shelf
          ? { ...state.shelvesById, [shelfId]: { ...shelf, itemCount: Math.max(shelf.itemCount - 1, 0) } }
          : state.shelvesById,
      };
    });
    return { error: null };
  },
}));
