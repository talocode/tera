import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { colors, layout } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  insetBottom?: boolean;
}

export function Screen({ children, scroll, insetBottom = true }: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, insetBottom && styles.bottomInset]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.content, styles.flex, insetBottom && styles.bottomInset]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 22,
  },
  flex: {
    flex: 1,
  },
  bottomInset: {
    paddingBottom: 28,
  },
});
