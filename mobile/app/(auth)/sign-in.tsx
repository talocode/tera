import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { signInSchema } from '@/features/auth/schemas';
import { useAuthActions } from '@/features/auth/useAuthActions';

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('learner@tera.ai');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  function submit() {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setError('');
    signIn.mutate(result.data, {
      onError: () => setError('Sign in failed. Try again.'),
    });
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">Welcome back</Text>
        <Text muted>Sign in to continue learning with Tera.</Text>
      </View>
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Sign in" onPress={submit} loading={signIn.isPending} />
        <Link href="/(auth)/forgot-password" style={styles.link}>Forgot password?</Link>
        <Link href="/(auth)/sign-up" style={styles.link}>Create an account</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  error: {
    color: colors.danger,
  },
  link: {
    color: colors.accent,
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
});
