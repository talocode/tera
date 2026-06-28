import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { AuthSession, TeraMode } from '@/types/domain';

const ONBOARDING_KEY = 'tera.onboarding.complete';

interface Preferences {
  conciseAnswers: boolean;
  notificationsEnabled: boolean;
}

interface AppState {
  hydrated: boolean;
  onboardingComplete: boolean;
  session: AuthSession | null;
  selectedMode: TeraMode;
  preferences: Preferences;
  setHydrated: (hydrated: boolean) => void;
  setSession: (session: AuthSession | null) => void;
  setSelectedMode: (mode: TeraMode) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  completeOnboarding: () => Promise<void>;
  loadOnboardingState: () => Promise<boolean>;
}

export const useAppStore = create<AppState>((set) => ({
  hydrated: false,
  onboardingComplete: false,
  session: null,
  selectedMode: 'learn',
  preferences: {
    conciseAnswers: false,
    notificationsEnabled: false,
  },
  setHydrated: (hydrated) => set({ hydrated }),
  setSession: (session) => set({ session }),
  setSelectedMode: (selectedMode) => set({ selectedMode }),
  setPreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } })),
  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ onboardingComplete: true });
  },
  loadOnboardingState: async () => {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    const onboardingComplete = value === 'true';
    set({ onboardingComplete });
    return onboardingComplete;
  },
}));
