import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

/** Shown at the top once the form is marked complete (the form below becomes read-only). */
export function CompletedCard({ at }: { at: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name="checkmark-done" size={36} color={colors.primaryText} />
      </View>
      <Text style={styles.title}>Form complete</Text>
      <Text style={styles.text}>Stored safely on this phone at {at}. It will sync when there is signal.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: size.radius,
    margin: 12,
    padding: 20,
    gap: 8,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.success },
  text: { fontSize: size.label, color: colors.text, textAlign: 'center' },
});
