import { create } from 'zustand';

import { supabase } from '../lib/supabase/client';
import { profileRowToCreator, type ProfileRow } from '../lib/supabase/mappers';
import type { Category, Creator, Region } from '../types';

interface CreatorState {
  creatorsById: Record<string, Creator>;
  completedJobOrderCountById: Record<string, number>;
  upsertFromRows: (rows: ProfileRow[]) => void;
  fetchByIds: (ids: string[]) => Promise<void>;
  getCreator: (id: string) => Creator | undefined;
  searchCreators: (query: string, filters?: { category?: Category | null; region?: Region | null }) => Promise<Creator[]>;
  isFollowing: (followerId: string, followeeId: string) => Promise<boolean>;
  fetchFollowingSet: (followerId: string, followeeIds: string[]) => Promise<Set<string>>;
  follow: (followerId: string, followeeId: string) => Promise<{ error: string | null }>;
  unfollow: (followerId: string, followeeId: string) => Promise<{ error: string | null }>;
  /** Public track-record stat for a creator's profile -- job_orders itself is only readable by
   *  its two participants, so this goes through the completed_job_order_count() RPC instead. */
  fetchCompletedJobOrderCount: (creatorId: string) => Promise<void>;
}

export const useCreatorStore = create<CreatorState>((set, get) => ({
  creatorsById: {},
  completedJobOrderCountById: {},

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

  fetchCompletedJobOrderCount: async (creatorId) => {
    const { data, error } = await supabase.rpc('completed_job_order_count', { p_creator_id: creatorId });
    if (error || data === null) return;
    set((state) => ({
      completedJobOrderCountById: { ...state.completedJobOrderCountById, [creatorId]: data as number },
    }));
  },

  isFollowing: async (followerId, followeeId) => {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
      .maybeSingle();
    return !!data;
  },

  fetchFollowingSet: async (followerId, followeeIds) => {
    const ids = [...new Set(followeeIds)];
    if (ids.length === 0) return new Set();

    const { data, error } = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', followerId)
      .in('followee_id', ids);
    if (error || !data) return new Set();
    return new Set(data.map((row) => row.followee_id as string));
  },

  follow: async (followerId, followeeId) => {
    const { error } = await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
    if (error) return { error: error.message };

    set((state) => {
      const next = { ...state.creatorsById };
      if (next[followeeId]) {
        next[followeeId] = { ...next[followeeId], followerCount: next[followeeId].followerCount + 1 };
      }
      if (next[followerId]) {
        next[followerId] = { ...next[followerId], followingCount: next[followerId].followingCount + 1 };
      }
      return { creatorsById: next };
    });
    return { error: null };
  },

  unfollow: async (followerId, followeeId) => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
    if (error) return { error: error.message };

    set((state) => {
      const next = { ...state.creatorsById };
      if (next[followeeId]) {
        next[followeeId] = {
          ...next[followeeId],
          followerCount: Math.max(next[followeeId].followerCount - 1, 0),
        };
      }
      if (next[followerId]) {
        next[followerId] = {
          ...next[followerId],
          followingCount: Math.max(next[followerId].followingCount - 1, 0),
        };
      }
      return { creatorsById: next };
    });
    return { error: null };
  },
}));
