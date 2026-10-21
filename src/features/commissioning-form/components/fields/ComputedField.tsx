import { StyleSheet, Text, View } from 'react-native';
import { FieldShell } from '../FieldShell';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';
import type { FieldProps } from './common';

/** Read-only. The value comes from the engine, never from the user. */
export function ComputedField({ field, path, computedValue, nested }: FieldProps) {
  const unit = 'unit' in field && field.unit ? field.unit : '';
  const has = computedValue !== undefined && computedValue !== null;
  // toFixed is display only; the stored value stays a number.
  const shown = has ? (typeof computedValue === 'number' ? computedValue.toFixed(2) : String(computedValue)) : null;
  return (
    <FieldShell path={path} label={field.label} help={field.help} filled={has} flat={nested}>
      <View
        style={[styles.box, has && styles.boxOn]}
        accessibilityLabel={`${field.label}: ${shown ? `${shown} ${unit}` : 'not yet calculated'}`}
      >
        <Icon name="calculator-outline" size={26} color={has ? colors.primary : colors.subtle} />
        {shown ? (
          <Text style={styles.value}>
            {shown} <Text style={styles.unit}>{unit}</Text>
          </Text>
        ) : (
          <Text style={styles.empty}>Calculated automatically</Text>
        )}
        <Text style={styles.auto}>AUTO</Text>
      </View>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: size.touch + 8,
    borderRadius: size.radius - 4,
    backgroundColor: colors.readOnlyBg,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boxOn: { backgroundColor: colors.primarySoft },
  value: { flex: 1, fontSize: 26, fontWeight: '800', color: colors.text },
  unit: { fontSize: size.text, fontWeight: '600', color: colors.muted },
  empty: { flex: 1, fontSize: size.label, color: colors.muted },
  auto: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1 },
});
