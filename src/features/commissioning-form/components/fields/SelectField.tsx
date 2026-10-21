import type { FieldDef } from '@/core/form-definition/schema';
import { isEmpty } from '@/core/form-engine/paths';
import { FieldShell } from '../FieldShell';
import { ChoiceButtons } from './ChoiceButtons';
import type { FieldProps } from './common';
import { useField } from '@/features/commissioning-form/hooks/useField';

type SelectDef = Extract<FieldDef, { type: 'select' }>;

/** Options come from the definition; values are stored as given (585, not "585"). */
export function SelectField({ field, path, error, nested }: FieldProps<SelectDef>) {
  const { value, setValue, readOnly } = useField(path);
  const choices = field.options.map((o) => ({ value: o, label: field.unit ? `${o} ${field.unit}` : String(o) }));
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
      <ChoiceButtons choices={choices} value={value} onChange={setValue} disabled={readOnly} hasError={!!error} />
    </FieldShell>
  );
}
