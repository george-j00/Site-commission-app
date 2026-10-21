import { StyleSheet, View } from 'react-native';
import { colors } from '@/shared/theme';

export function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }, pct === 100 && { backgroundColor: colors.success }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: colors.readOnlyBg, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
