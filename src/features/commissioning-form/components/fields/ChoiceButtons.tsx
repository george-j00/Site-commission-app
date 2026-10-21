import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

export type Choice = { value: unknown; label: string; icon?: IconName; tone?: 'primary' | 'success' | 'neutral' };

const TONE = {
  primary: { bg: colors.primary, soft: colors.primarySoft },
  success: { bg: colors.success, soft: colors.successSoft },
  neutral: { bg: colors.muted, soft: colors.readOnlyBg },
};

/**
 * Big tap targets instead of switches or dropdowns: usable with gloves and
 * readable in sunlight. Up to 4 options sit in one row; more wrap into a
 * 4-column grid. Tap the selected option again to clear it.
 */
export function ChoiceButtons({
  choices,
  value,
  onChange,
  disabled,
  hasError,
}: {
  choices: Choice[];
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const grid = choices.length > 4;
  return (
    <View style={styles.wrap}>
      {choices.map((c) => {
        const on = c.value === value;
        const tone = TONE[c.tone ?? 'primary'];
        return (
          <Pressable
            key={String(c.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled }}
            accessibilityLabel={c.label}
            onPress={() => onChange(on ? undefined : c.value)}
            style={({ pressed }) => [
              styles.choice,
              grid ? styles.cell : styles.flex,
              hasError && !on ? { borderColor: colors.danger } : null,
              on ? { backgroundColor: tone.bg, borderColor: tone.bg } : null,
              pressed && !on ? { backgroundColor: tone.soft } : null,
            ]}
          >
            {c.icon ? <Icon name={c.icon} size={22} color={on ? colors.primaryText : colors.muted} /> : null}
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1} adjustsFontSizeToFit>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: size.touch,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: size.radius - 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.surface,
  },
  flex: { flexGrow: 1, flexBasis: 0 },
  cell: { width: '23.2%' },
  text: { fontSize: size.text, fontWeight: '700', color: colors.text },
  textOn: { color: colors.primaryText },
});
