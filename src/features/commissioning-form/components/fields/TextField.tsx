import { TextInput } from 'react-native';
import { isEmpty } from '@/core/form-engine/paths';
import { FieldShell } from '../FieldShell';
import { colors } from '@/shared/theme';
import { fieldStyles as s, FieldProps } from './common';
import { useField } from '@/features/commissioning-form/hooks/useField';

export function TextField({ field, path, error, nested }: FieldProps) {
  const { value, setValue, readOnly, draftId } = useField(path);
  return (
    <FieldShell
      path={path}
      label={field.label}
      required={field.required}
      help={field.help}
      error={error}
      filled={!isEmpty(value)}
      flat={nested}
    >
      {/* Uncontrolled (defaultValue): the native input owns keystrokes, the store just records them.
          A controlled value round-trips every key through JS and drops/duplicates characters on slow phones.
          Keyed by draft id so a new form starts empty. */}
      <TextInput
        key={draftId}
        style={[s.input, error ? s.inputError : null]}
        defaultValue={typeof value === 'string' ? value : ''}
        onChangeText={(t) => setValue(t === '' ? undefined : t)}
        editable={!readOnly}
        autoCorrect={false}
        autoCapitalize="characters"
        placeholder={`Enter ${field.label.toLowerCase()}`}
        placeholderTextColor={colors.subtle}
        returnKeyType="done"
        accessibilityLabel={field.label}
      />
    </FieldShell>
  );
}
