import { useMemo } from 'react';
import { localToday } from '@/core/form-engine/form';
import { evaluateDraft, useFormStore } from '../store/formStore';

/** The engine's answer for the current draft, re-derived only when the draft changes. */
export function useFormEvaluation() {
  const def = useFormStore((s) => s.def)!;
  const draft = useFormStore((s) => s.draft)!;
  const today = localToday();
  // evaluateDraft is the same function Save/Complete use, so screen and store always agree.
  return useMemo(() => evaluateDraft(def, draft, today), [def, draft, today]);
}
