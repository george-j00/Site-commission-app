import { useMemo } from 'react';
import type { Evaluation } from '@/core/form-engine/form';
import type { FormError } from '@/core/form-engine/validate';
import { PHOTOS_TAB, SectionTab } from './useSectionProgress';

export type Problem = {
  key: string;
  target: string; // field path, or "photo:<slotId>"
  sectionId: string;
  text: string;
  where: string;
  kind: 'rule' | 'invalid' | 'required' | 'photo';
};

/** Everything the user still has to fix, worded for the problem sheet. Missing photos join after a Save/Complete attempt. */
export function useProblems(
  ev: Evaluation,
  shown: FormError[],
  showAll: boolean,
  tabs: SectionTab[],
  photoTitle: string,
): Problem[] {
  return useMemo(() => {
    const titleOf = (id: string) => tabs.find((t) => t.id === id)?.title ?? id;
    const fields: Problem[] = shown.map((e, i) => ({
      key: `e${i}`,
      target: e.path,
      sectionId: e.sectionId,
      kind: e.kind,
      text: e.kind === 'rule' ? e.message : `${e.label}: ${e.message}`,
      where: titleOf(e.sectionId),
    }));
    const photos: Problem[] = showAll
      ? ev.outstanding.map((s) => ({
          key: `p${s.id}`,
          target: `photo:${s.id}`,
          sectionId: PHOTOS_TAB,
          kind: 'photo',
          text: `Photo missing: ${s.groupLabel} — ${s.label}`,
          where: photoTitle,
        }))
      : [];
    return [...fields, ...photos];
  }, [ev.outstanding, shown, showAll, tabs, photoTitle]);
}
