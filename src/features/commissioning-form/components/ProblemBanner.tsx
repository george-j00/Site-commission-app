import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

/** Red strip under the tabs: "3 things to fix — View". Opens the problem sheet. */
export function ProblemBanner({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.banner}
      accessibilityRole="button"
      accessibilityLabel={`${count} things to fix. View list`}
    >
      <Icon name="warning" size={22} color={colors.danger} />
      <Text style={styles.text}>
        {count} thing{count > 1 ? 's' : ''} to fix
      </Text>
      <Text style={styles.link}>View</Text>
      <Icon name="chevron-up" size={20} color={colors.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: size.touch - 4,
    paddingHorizontal: 16,
    backgroundColor: colors.dangerSoft,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  text: { flex: 1, color: colors.danger, fontSize: size.label, fontWeight: '800' },
  link: { color: colors.danger, fontSize: size.label, fontWeight: '700', textDecorationLine: 'underline' },
});
