import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: colors.accentSoft,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="⌂" /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="◷" /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="✦" /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="◎" /> }} />
    </Tabs>
  );
}

function TabGlyph({ color, glyph }: { color: string; glyph: string }) {
  return <Text style={[styles.glyph, { color }]}>{glyph}</Text>;
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: colors.border,
    minHeight: 78,
    paddingBottom: 12,
    paddingTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  glyph: {
    fontSize: 18,
    fontWeight: '700',
  },
});
