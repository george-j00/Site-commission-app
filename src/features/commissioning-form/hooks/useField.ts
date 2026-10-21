import { getIn } from '@/core/form-engine/paths';
import { useFormStore } from '@/features/commissioning-form/store/formStore';

/** Narrow subscription: this field re-renders only when its own value changes. */
export function useField(path: string) {
  const value = useFormStore((s) => getIn(s.draft?.values, path));
  const setValue = useFormStore((s) => s.setValue);
  const readOnly = useFormStore((s) => s.draft?.status === 'complete');
  const draftId = useFormStore((s) => s.draft?.id);
  return { value, setValue: (v: unknown) => setValue(path, v), readOnly, draftId };
}
