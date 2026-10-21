import { isEmpty } from '@/core/form-engine/paths';
import { FieldShell } from '../FieldShell';
import { Choice, ChoiceButtons } from './ChoiceButtons';
import type { FieldProps } from './common';
import { useField } from '@/features/commissioning-form/hooks/useField';

const CHOICES: Choice[] = [
  { value: true, label: 'Yes', icon: 'checkmark-circle-outline', tone: 'success' },
  { value: false, label: 'No', icon: 'close-circle-outline', tone: 'neutral' },
];

export function YesNoField({ field, path, error, nested }: FieldProps) {
  const { value, setValue, readOnly } = useField(path);
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
      <ChoiceButtons choices={CHOICES} value={value} onChange={setValue} disabled={readOnly} hasError={!!error} />
    </FieldShell>
  );
}
