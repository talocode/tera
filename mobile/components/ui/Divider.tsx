import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderMuted,
  },
});
