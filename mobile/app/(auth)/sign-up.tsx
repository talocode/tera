import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { signUpSchema } from '@/features/auth/schemas';
import { useAuthActions } from '@/features/auth/useAuthActions';

export default function SignUpScreen() {
  const { signUp } = useAuthActions();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const result = signUpSchema.safeParse({ name, email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setError('');
    signUp.mutate(result.data, {
      onError: () => setError('Could not create your account. Try again.'),
    });
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">Create your Tera account</Text>
        <Text muted>Start with a focused AI companion for learning, research, and building.</Text>
      </View>
      <View style={styles.form}>
        <TextField label="Name" value={name} onChangeText={setName} />
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
        <Button label="Create account" onPress={submit} loading={signUp.isPending} />
        <Link href="/(auth)/sign-in" style={styles.link}>I already have an account</Link>
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
