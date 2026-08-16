import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface IntroState {
  hasSeenIntro: boolean;
  hasHydrated: boolean;
  markIntroSeen: () => void;
}

export const useIntroStore = create<IntroState>()(
  persist(
    (set) => ({
      hasSeenIntro: false,
      hasHydrated: false,
      markIntroSeen: () => set({ hasSeenIntro: true }),
    }),
    {
      name: 'likha-intro',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useIntroStore.setState({ hasHydrated: true });
      },
      partialize: (state) => ({ hasSeenIntro: state.hasSeenIntro }),
    },
  ),
);
