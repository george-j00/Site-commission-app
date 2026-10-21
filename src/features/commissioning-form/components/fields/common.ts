import { StyleSheet } from 'react-native';
import type { FieldDef, ItemFieldDef } from '@/core/form-definition/schema';
import type { ResolvedRow } from '@/core/form-engine/resolve';
import { colors, size } from '@/shared/theme';

/** Props every field component receives from FieldRenderer. */
export type FieldProps<T = FieldDef | ItemFieldDef> = {
  field: T;
  path: string;
  error?: string;
  nested?: boolean; // inside a repeater block
  computedValue?: unknown; // computed fields
  rows?: ResolvedRow[]; // repeaters
  errors?: Record<string, string>; // repeaters: errors of their row fields
};

export const fieldStyles = StyleSheet.create({
  input: {
    minHeight: size.touch,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: size.radius - 4,
    paddingHorizontal: 14,
    fontSize: size.text + 1,
    color: colors.text,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  inputError: { borderColor: colors.danger },
  inputText: { fontSize: size.text + 1, color: colors.text, fontWeight: '600' },
  placeholder: { fontSize: size.text, color: colors.subtle },
});
