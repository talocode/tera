import { Redirect } from 'expo-router';
import { LoadingState, Screen } from '@/components/ui';
import { useAppStore } from '@/store/app-store';

export default function IndexRoute() {
  const hydrated = useAppStore((state) => state.hydrated);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const session = useAppStore((state) => state.session);

  if (!hydrated) {
    return (
      <Screen>
        <LoadingState label="Preparing Tera..." />
      </Screen>
    );
  }

  if (!onboardingComplete) return <Redirect href="/(onboarding)" />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)" />;
}
