import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/theme';
import { onboardingSlides } from '@/features/onboarding/onboarding-content';
import { useAppStore } from '@/store/app-store';

export default function OnboardingScreen() {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  async function continueToAuth() {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  }

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.heroMark}>
          <Text variant="caption" style={styles.markText}>TeraAI</Text>
        </View>
        <View style={styles.header}>
          <Text variant="hero">Learn clearly. Build from what you know.</Text>
          <Text variant="body" muted>
            Tera is an AI learning companion for explanations, research, and turning ideas into action.
          </Text>
        </View>
      </View>
      <View style={styles.slides}>
        {onboardingSlides.map((slide, index) => (
          <View key={slide.title} style={styles.slide}>
            <Text variant="overline" style={styles.step}>0{index + 1}</Text>
            <View style={styles.slideCopy}>
              <Text variant="title">{slide.title}</Text>
              <Text variant="bodySmall" muted>{slide.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.cta}>
        <Button label="Continue" onPress={continueToAuth} />
        <Text variant="bodySmall" muted style={styles.footnote}>
          Android-first foundation for chat, history, saved knowledge, and profile settings.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  heroMark: {
    width: 84,
    height: 84,
    borderRadius: radii.xl,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  markText: {
    color: colors.accentSoft,
  },
  header: {
    gap: spacing.lg,
  },
  slides: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  slide: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  step: {
    color: colors.accent,
    width: 28,
    paddingTop: spacing.xs,
  },
  slideCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cta: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  footnote: {
    textAlign: 'center',
  },
});
