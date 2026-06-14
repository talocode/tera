import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { teraApi } from '@/lib/api/client';
import { clearStoredSession, saveStoredSession } from '@/lib/storage/secureSession';
import { useAppStore } from '@/store/app-store';

export function useAuthActions() {
  const queryClient = useQueryClient();
  const setSession = useAppStore((state) => state.setSession);

  const signIn = useMutation({
    mutationFn: ({ email }: { email: string; password: string }) => teraApi.signIn(email),
    onSuccess: async (session) => {
      await saveStoredSession(session);
      setSession(session);
      router.replace('/(tabs)');
    },
  });

  const signUp = useMutation({
    mutationFn: ({ name, email }: { name: string; email: string; password: string }) =>
      teraApi.signUp(name, email),
    onSuccess: async (session) => {
      await saveStoredSession(session);
      setSession(session);
      router.replace('/(tabs)');
    },
  });

  const resetPassword = useMutation({
    mutationFn: () => teraApi.requestPasswordReset(),
  });

  async function signOut() {
    await clearStoredSession();
    setSession(null);
    queryClient.clear();
    router.replace('/(auth)/sign-in');
  }

  return {
    signIn,
    signUp,
    resetPassword,
    signOut,
  };
}
