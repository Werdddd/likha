import { create } from 'zustand';

import { currentUser as mockUser } from '../constants/mock-data';
import type { Creator, ProfileMode } from '../types';

interface SessionState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  currentUser: Creator;
  signUp: (name: string, email: string) => void;
  logIn: (email: string) => void;
  logOut: () => void;
  setProfileMode: (mode: ProfileMode) => void;
  completeOnboarding: (details: Partial<Pick<Creator, 'bio' | 'region' | 'disciplines' | 'tags'>>) => void;
  updateProfile: (details: Partial<Creator>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  currentUser: mockUser,
  signUp: (name, email) =>
    set((state) => ({
      isAuthenticated: true,
      hasCompletedOnboarding: false,
      currentUser: { ...state.currentUser, name, handle: email.split('@')[0] },
    })),
  logIn: () => set({ isAuthenticated: true, hasCompletedOnboarding: true }),
  logOut: () => set({ isAuthenticated: false, hasCompletedOnboarding: false }),
  setProfileMode: (mode) =>
    set((state) => ({ currentUser: { ...state.currentUser, profileMode: mode } })),
  completeOnboarding: (details) =>
    set((state) => ({
      hasCompletedOnboarding: true,
      currentUser: { ...state.currentUser, ...details },
    })),
  updateProfile: (details) =>
    set((state) => ({ currentUser: { ...state.currentUser, ...details } })),
}));
