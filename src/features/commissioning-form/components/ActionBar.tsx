import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

/** Always within thumb reach at the bottom of the screen. */
export function ActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>{children}</View>;
}

export function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
  flex,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  flex?: number;
}) {
  const fg = variant === 'secondary' ? colors.primary : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.primary,
        variant === 'success' && styles.success,
        variant === 'secondary' && styles.secondary,
        flex ? { flex } : null,
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon ? <Icon name={icon} size={22} color={fg} /> : null}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: {
    minHeight: size.touch,
    borderRadius: size.radius,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  secondary: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  text: { fontSize: size.text, fontWeight: '800' },
});
