import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { forgotPasswordSchema } from '@/features/auth/schemas';
import { useAuthActions } from '@/features/auth/useAuthActions';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuthActions();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter your email.');
      return;
    }
    setError('');
    resetPassword.mutate(undefined, {
      onSuccess: () => setMessage('Password reset delivery is mocked for this foundation build.'),
      onError: () => setError('Could not start password reset.'),
    });
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">Reset password</Text>
        <Text muted>Enter your email. This screen is ready for backend email delivery.</Text>
      </View>
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button label="Send reset link" onPress={submit} loading={resetPassword.isPending} />
        <Link href="/(auth)/sign-in" style={styles.link}>Back to sign in</Link>
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
  message: {
    color: colors.accent,
  },
  link: {
    color: colors.accent,
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
});
