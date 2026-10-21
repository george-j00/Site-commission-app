import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import type { FormDefinition } from '@/core/form-definition/schema';
import { Evaluation, evaluateForm, localToday } from '@/core/form-engine/form';
import { setIn } from '@/core/form-engine/paths';
import { definitionRepository } from '@/data/repositories/definitionRepository';
import { Draft, draftRepository } from '@/data/repositories/draftRepository';
import { FORM_ID } from '@/shared/config';

/**
 * All form state lives here (never in component useState), so autosave sees
 * every change. Components subscribe with narrow selectors, e.g.
 * useFormStore(s => getIn(s.draft.values, path)), so typing in one field
 * re-renders only that field.
 */
type FormState = {
  def: FormDefinition | null;
  draft: Draft | null;
  restored: boolean; // reopened an existing draft (show a note)
  initError: string | null; // startup failed (e.g. unreadable definition)
  touched: Record<string, true>; // fields the user has changed: show their "Required" errors
  showAllErrors: boolean; // after a Save/Complete attempt
  init: (formId: string) => void;
  setValue: (path: string, value: unknown) => void;
  setPhoto: (slotId: string, captured: boolean) => void;
  save: () => Evaluation;
  complete: () => Evaluation;
  newForm: () => void;
};

/**
 * The one place a draft is evaluated. The screen (useFormEvaluation) and
 * Save/Complete both call this, so they can never disagree.
 */
export function evaluateDraft(def: FormDefinition, draft: Draft, today = localToday()): Evaluation {
  return evaluateForm(def, draft.values, draft.photos, today);
}

function newDraft(def: FormDefinition): Draft {
  return {
    id: randomUUID(),
    formId: def.formId,
    formVersion: def.version,
    values: {},
    photos: {},
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
}

function touch(d: Draft, patch: Partial<Draft>): Draft {
  // Any edit after a Save means there are unsaved changes again.
  const status = d.status === 'saved' ? 'draft' : d.status;
  return { ...d, status, ...patch, updatedAt: new Date().toISOString() };
}

export const useFormStore = create<FormState>((set, get) => {
  /** Validate, then commit the pruned record if `ok` says the evaluation allows it. */
  const commit = (status: 'saved' | 'complete', ok: (e: Evaluation) => boolean): Evaluation => {
    const { def, draft } = get();
    if (!def || !draft) throw new Error('Form not initialised');
    const ev = evaluateDraft(def, draft);
    set({ showAllErrors: true });
    if (ok(ev)) {
      const at = new Date().toISOString();
      set({ draft: { ...draft, status, saved: { at, record: ev.record, photos: ev.photosRecord }, updatedAt: at } });
    }
    return ev;
  };

  return {
    def: null,
    draft: null,
    restored: false,
    initError: null,
    touched: {},
    showAllErrors: false,

    init(formId) {
      try {
        const existing = draftRepository.loadOpen(formId);
        // A draft keeps the definition version it was started on.
        const pinned = existing && definitionRepository.getDefinitionVersion(formId, existing.formVersion);
        if (existing && pinned) {
          set({ def: pinned, draft: existing, restored: true });
        } else {
          const def = definitionRepository.getDefinition(formId);
          set({ def, draft: newDraft(def), restored: false });
        }
      } catch (e) {
        set({ initError: e instanceof Error ? e.message : String(e) });
      }
    },

    setValue(path, value) {
      const d = get().draft;
      if (!d || d.status === 'complete') return;
      set({ draft: touch(d, { values: setIn(d.values, path, value) }), touched: { ...get().touched, [path]: true } });
    },

    setPhoto(slotId, captured) {
      const d = get().draft;
      if (!d || d.status === 'complete') return;
      const photos = { ...d.photos };
      if (captured) photos[slotId] = { capturedAt: new Date().toISOString() };
      else delete photos[slotId];
      set({ draft: touch(d, { photos }) });
    },

    // Save = partial commit, blocked only by broken rules / invalid values.
    save: () => commit('saved', (ev) => ev.canSave),
    // Complete = also needs every required field and every visible photo slot.
    complete: () => commit('complete', (ev) => ev.canComplete),

    newForm() {
      // New forms always use the newest definition.
      const def = definitionRepository.getDefinition(FORM_ID);
      set({ def, draft: newDraft(def), restored: false, touched: {}, showAllErrors: false });
    },
  };
});
