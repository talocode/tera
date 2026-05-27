import { useEffect } from 'react';
import { getStoredSession } from '@/lib/storage/secureSession';
import { useAppStore } from '@/store/app-store';

export function useSessionBootstrap() {
  const loadOnboardingState = useAppStore((state) => state.loadOnboardingState);
  const setHydrated = useAppStore((state) => state.setHydrated);
  const setSession = useAppStore((state) => state.setSession);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const [session] = await Promise.all([
        getStoredSession(),
        loadOnboardingState(),
      ]);

      if (!mounted) return;
      setSession(session);
      setHydrated(true);
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [loadOnboardingState, setHydrated, setSession]);
}
