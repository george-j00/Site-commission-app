import type { FormDefinition } from '@/core/form-definition/schema';
import { Evaluation, evaluateForm, localToday } from '@/core/form-engine/form';
import { formProgress } from '@/core/form-engine/progress';
import { definitionRepository } from '@/data/repositories/definitionRepository';
import type { Draft } from '@/data/repositories/draftRepository';

export type DraftView = {
  draft: Draft;
  def: FormDefinition;
  ev: Evaluation;
  progress: ReturnType<typeof formProgress>;
};

/**
 * A stored draft plus what the engine says about it, using the definition
 * version it was started on (falling back to the newest if that's gone).
 */
export function loadDraftView(draft: Draft): DraftView {
  const def =
    definitionRepository.getDefinitionVersion(draft.formId, draft.formVersion) ??
    definitionRepository.getDefinition(draft.formId);
  const ev = evaluateForm(def, draft.values, draft.photos, localToday());
  return { draft, def, ev, progress: formProgress(ev, draft.values, draft.photos) };
}
