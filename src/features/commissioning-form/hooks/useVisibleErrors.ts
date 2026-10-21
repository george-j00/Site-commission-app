import { useMemo } from 'react';
import type { Evaluation } from '@/core/form-engine/form';
import { useFormStore } from '../store/formStore';

/**
 * Which errors to show right now. Broken rules always; "Required" only once
 * the user has touched that field or pressed Save/Complete — a fresh form
 * shouldn't open covered in red.
 */
export function useVisibleErrors(ev: Evaluation) {
  const touched = useFormStore((s) => s.touched);
  const showAll = useFormStore((s) => s.showAllErrors);

  const shown = useMemo(
    () => ev.errors.filter((e) => e.kind !== 'required' || touched[e.path] || showAll),
    [ev.errors, touched, showAll],
  );
  const errorByPath = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of shown) m[e.path] ??= e.message;
    return m;
  }, [shown]);

  return { shown, errorByPath, showAll };
}
