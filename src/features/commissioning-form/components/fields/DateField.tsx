import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { localToday } from '@/core/form-engine/form';
import { formatYmd as friendly, ymdToLocalDate as toLocalDate } from '@/shared/format';
import { FieldShell } from '../FieldShell';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';
import { fieldStyles as s, FieldProps } from './common';
import { useField } from '@/features/commissioning-form/hooks/useField';

/**
 * Stored as YYYY-MM-DD so rules compare dates as plain strings with no
 * timezone maths. The picker also refuses future dates (maximumDate), but
 * the rule in the definition is what actually enforces it.
 * "Today" is one tap — most entries on site are for today.
 */
export function DateField({ field, path, error, nested }: FieldProps) {
  const { value, setValue, readOnly } = useField(path);
  const [open, setOpen] = useState(false); // UI-only: whether the picker is showing
  const current = typeof value === 'string' ? value : undefined;
  const todayStr = localToday();

  const onChange = (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (e.type === 'set' && date) setValue(localToday(date));
  };

  return (
    <FieldShell
      path={path}
      label={field.label}
      required={field.required}
      help={field.help}
      error={error}
      filled={!!current}
      flat={nested}
    >
      <Pressable
        disabled={readOnly}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [
          s.input,
          styles.button,
          error ? s.inputError : null,
          // While the picker is open the box is highlighted and the chevron points up (tap again to close).
          open && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
          pressed && { backgroundColor: colors.primarySoft },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${field.label}: ${current ? friendly(current) : 'not set'}. ${open ? 'Tap to close the calendar' : 'Tap to choose a date'}`}
      >
        <Icon name="calendar-outline" size={24} color={current || open ? colors.primary : colors.subtle} />
        <Text style={[current ? s.inputText : s.placeholder, { flex: 1 }]}>
          {current ? friendly(current) : 'Select date'}
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={open ? colors.primary : colors.muted} />
      </Pressable>
      {!readOnly ? (
        <View style={styles.quick}>
          <Chip label="Today" icon="today-outline" onPress={() => setValue(todayStr)} active={current === todayStr} />
          {current ? <Chip label="Clear" icon="close" onPress={() => setValue(undefined)} /> : null}
        </View>
      ) : null}
      {open ? (
        <DateTimePicker
          value={current ? toLocalDate(current) : toLocalDate(todayStr)}
          mode="date"
          maximumDate={toLocalDate(todayStr)}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChange}
        />
      ) : null}
    </FieldShell>
  );
}

function Chip({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon: 'today-outline' | 'close';
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        (pressed || active) && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
      ]}
    >
      <Icon name={icon} size={18} color={colors.primary} />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quick: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: size.label, fontWeight: '700', color: colors.primary },
});
