import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { profileRowToCreator, type ProfileRow } from '../lib/supabase/mappers';
import type { Category, Creator, Region } from '../types';

interface CreatorState {
  creatorsById: Record<string, Creator>;
  upsertFromRows: (rows: ProfileRow[]) => void;
  fetchByIds: (ids: string[]) => Promise<void>;
  getCreator: (id: string) => Creator | undefined;
  searchCreators: (query: string, filters?: { category?: Category | null; region?: Region | null }) => Promise<Creator[]>;
}

export const useCreatorStore = create<CreatorState>((set, get) => ({
  creatorsById: {},

  upsertFromRows: (rows) => {
    if (rows.length === 0) return;
    set((state) => {
      const next = { ...state.creatorsById };
      for (const row of rows) {
        next[row.id] = profileRowToCreator(row);
      }
      return { creatorsById: next };
    });
  },

  fetchByIds: async (ids) => {
    const missing = [...new Set(ids)].filter((id) => id && !get().creatorsById[id]);
    if (missing.length === 0) return;

    const { data, error } = await supabase.from('profiles').select('*').in('id', missing);
    if (error || !data) return;
    get().upsertFromRows(data as ProfileRow[]);
  },

  getCreator: (id) => get().creatorsById[id],

  searchCreators: async (query, filters) => {
    const safeQuery = query.replace(/[%,()]/g, '').trim();
    if (safeQuery.length === 0) return [];

    let request = supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${safeQuery}%,handle.ilike.%${safeQuery}%`)
      .limit(20);
    if (filters?.category) request = request.contains('categories', [filters.category]);
    if (filters?.region) request = request.eq('region', filters.region);

    const { data, error } = await request;
    if (error || !data) return [];

    const rows = data as ProfileRow[];
    get().upsertFromRows(rows);
    return rows.map(profileRowToCreator);
  },
}));
