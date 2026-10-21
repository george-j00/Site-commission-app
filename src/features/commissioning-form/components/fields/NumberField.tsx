import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { FieldDef } from '@/core/form-definition/schema';
import { isEmpty } from '@/core/form-engine/paths';
import { FieldShell } from '../FieldShell';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';
import { fieldStyles as s, FieldProps } from './common';
import { useField } from '@/features/commissioning-form/hooks/useField';

type NumberDef = Extract<FieldDef, { type: 'number' }>;

/**
 * Stored as a number (12, not "12") so computed fields and rules can do maths.
 * Text that isn't a number is kept as typed so the user sees it and gets
 * "Must be a number" rather than having it silently disappear.
 * The − / + buttons let a gloved hand adjust the count without the keyboard.
 */
export function NumberField({ field, path, error, nested }: FieldProps<NumberDef>) {
  const { value, setValue, readOnly, draftId } = useField(path);
  // The input is uncontrolled; bumping this remounts it so it shows a value set by − / +.
  const [stepKey, setStepKey] = useState(0);

  const onChange = (t: string) => {
    const trimmed = t.trim();
    if (trimmed === '') return setValue(undefined);
    const n = Number(trimmed);
    setValue(Number.isFinite(n) && !trimmed.endsWith('.') ? n : t);
  };
  const step = (delta: number) => {
    const current = typeof value === 'number' ? value : 0;
    let next = current + delta;
    if (field.min !== undefined) next = Math.max(field.min, next);
    if (field.max !== undefined) next = Math.min(field.max, next);
    setValue(Math.max(0, next));
    setStepKey((k) => k + 1);
  };

  const label = field.unit ? `${field.label} (${field.unit})` : field.label;
  return (
    <FieldShell
      path={path}
      label={label}
      required={field.required}
      help={field.help}
      error={error}
      filled={!isEmpty(value)}
      flat={nested}
    >
      <View style={styles.row}>
        <StepButton icon="remove" onPress={() => step(-1)} disabled={readOnly} label={`Decrease ${field.label}`} />
        <TextInput
          key={`${draftId}:${stepKey}`}
          style={[s.input, styles.input, error ? s.inputError : null]}
          defaultValue={value === undefined || value === null ? '' : String(value)}
          onChangeText={onChange}
          editable={!readOnly}
          keyboardType={field.integer ? 'number-pad' : 'decimal-pad'}
          placeholder="0"
          placeholderTextColor={colors.subtle}
          accessibilityLabel={field.label}
        />
        <StepButton icon="add" onPress={() => step(1)} disabled={readOnly} label={`Increase ${field.label}`} />
      </View>
    </FieldShell>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
  label,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.step, pressed && { backgroundColor: colors.primary }]}
    >
      {({ pressed }) => <Icon name={icon} size={28} color={pressed ? colors.primaryText : colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  step: {
    width: size.touch + 4,
    height: size.touch,
    borderRadius: size.radius - 4,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
