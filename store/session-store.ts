import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { unregisterPushToken } from '../lib/push-notifications';
import { supabase } from '../lib/supabase/client';
import { creatorUpdatesToProfileRow, profileRowToCreator, type ProfileRow } from '../lib/supabase/mappers';
import type { Creator, ProfileMode } from '../types';

const EMPTY_USER: Creator = {
  id: '',
  name: '',
  handle: '',
  avatarUrl: '',
  coverUrl: '',
  bio: '',
  region: 'NCR',
  categories: [],
  profileMode: 'portfolio',
  tags: [],
  followerCount: 0,
  followingCount: 0,
  projectCount: 0,
  badges: [],
  role: 'user',
};

interface SessionState {
  isHydrating: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  currentUser: Creator;
  signUp: (
    name: string,
    handle: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  logIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logOut: () => Promise<void>;
  setProfileMode: (mode: ProfileMode) => Promise<void>;
  completeOnboarding: (
    details: Partial<Pick<Creator, 'bio' | 'region' | 'categories' | 'tags'>>,
  ) => Promise<void>;
  updateProfile: (details: Partial<Creator>) => Promise<void>;
}

async function fetchProfile(
  userId: string,
): Promise<{ creator: Creator; hasCompletedOnboarding: boolean } | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  const row = data as ProfileRow;
  return { creator: profileRowToCreator(row), hasCompletedOnboarding: row.region !== null };
}

export const useSessionStore = create<SessionState>((set, get) => {
  const hydrateFromSession = async (session: Session | null) => {
    if (!session) {
      set({ isHydrating: false, isAuthenticated: false, hasCompletedOnboarding: false, currentUser: EMPTY_USER });
      return;
    }

    const profile = await fetchProfile(session.user.id);
    set({
      isHydrating: false,
      isAuthenticated: true,
      hasCompletedOnboarding: profile?.hasCompletedOnboarding ?? false,
      currentUser: profile?.creator ?? { ...EMPTY_USER, id: session.user.id },
    });
  };

  supabase.auth.getSession().then(({ data }) => hydrateFromSession(data.session));
  supabase.auth.onAuthStateChange((_event, session) => {
    hydrateFromSession(session);
  });

  return {
    isHydrating: true,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    currentUser: EMPTY_USER,

    signUp: async (name, handle, email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message, needsEmailConfirmation: false };

      if (!data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      await hydrateFromSession(data.session);
      const updates: Partial<Creator> = {};
      if (name.trim()) updates.name = name.trim();
      if (handle.trim()) updates.handle = handle.trim().toLowerCase();
      if (Object.keys(updates).length > 0) {
        await get().updateProfile(updates);
      }
      return { error: null, needsEmailConfirmation: false };
    },

    logIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      await hydrateFromSession(data.session);
      return { error: null };
    },

    logOut: async () => {
      // Deletes the row for this device's token before the session goes away -- RLS requires
      // auth.uid() = user_id, so this only works while still signed in.
      await unregisterPushToken();
      await supabase.auth.signOut();
      set({ isAuthenticated: false, hasCompletedOnboarding: false, currentUser: EMPTY_USER });
    },

    setProfileMode: async (mode) => {
      await get().updateProfile({ profileMode: mode });
    },

    completeOnboarding: async (details) => {
      await get().updateProfile(details);
    },

    updateProfile: async (details) => {
      const userId = get().currentUser.id;
      if (!userId) return;

      const row = creatorUpdatesToProfileRow(details);
      if (Object.keys(row).length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .update(row)
        .eq('id', userId)
        .select()
        .single();
      if (error || !data) return;

      const profileRow = data as ProfileRow;
      set({
        currentUser: profileRowToCreator(profileRow),
        hasCompletedOnboarding: profileRow.region !== null,
      });
    },
  };
});
