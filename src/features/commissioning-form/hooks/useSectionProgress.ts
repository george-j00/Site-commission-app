import { useMemo } from 'react';
import type { Evaluation } from '@/core/form-engine/form';
import { isFieldDone, leafFields } from '@/core/form-engine/progress';
import type { FormError } from '@/core/form-engine/validate';
import { useFormStore } from '../store/formStore';

/** The photo groups render as their own section tab. */
export const PHOTOS_TAB = '__photos';

export type SectionTab = { id: string; title: string; done: number; total: number; problems: number };

/** Per-section "done / total / problems" for the tabs, plus overall progress for the header. */
export function useSectionProgress(ev: Evaluation, shown: FormError[], showAll: boolean) {
  const def = useFormStore((s) => s.def)!;
  const values = useFormStore((s) => s.draft!.values);
  const photos = useFormStore((s) => s.draft!.photos);

  const tabs = useMemo(() => {
    const anyError = new Set(ev.errors.map((e) => e.path));
    const t: SectionTab[] = ev.sections.map((s) => {
      const l = leafFields(s.fields);
      return {
        id: s.def.id,
        title: s.def.title,
        total: l.length,
        done: l.filter((f) => isFieldDone(f, values, anyError)).length,
        problems: shown.filter((e) => e.sectionId === s.def.id).length,
      };
    });
    if (ev.photoGroups.length) {
      const slots = ev.photoGroups.flatMap((g) => g.slots);
      t.push({
        id: PHOTOS_TAB,
        title: def.photoSectionTitle,
        total: slots.length,
        done: slots.filter((s) => photos[s.id]).length,
        problems: showAll ? ev.outstanding.length : 0,
      });
    }
    return t;
  }, [ev, values, photos, shown, showAll, def.photoSectionTitle]);

  const totals = tabs.reduce((a, t) => ({ done: a.done + t.done, total: a.total + t.total }), { done: 0, total: 0 });
  return { tabs, progress: totals.total ? totals.done / totals.total : 0 };
}
