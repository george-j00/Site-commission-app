import type { FormDefinition } from '../definition/schema';
import { outstandingSlots, Photos, visiblePhotos } from './completeness';
import { getIn, Values } from './paths';
import { ResolvedField, ResolvedForm, resolveForm } from './resolve';
import { FormError, fieldError, ruleErrors } from './validate';
import type { ResolvedSlot } from './resolve';

export type Evaluation = ResolvedForm & {
  errors: FormError[];
  outstanding: ResolvedSlot[];
  /** Save = commit a partial form. Blocked only by broken rules / invalid values. */
  canSave: boolean;
  /** Complete = finished form. Also needs every required field and every visible photo slot. */
  canComplete: boolean;
  photosRecord: Photos;
};
 
/**
 * The single question the UI asks: given this definition, these values and
 * photos, and today's date — what is visible, what is computed, what is wrong?
 * Pure: no React, no storage, so every behaviour is unit-testable.
 */
export function evaluateForm(def: FormDefinition, values: Values, photos: Photos, today: string): Evaluation {
  const resolved = resolveForm(def, values, today);
  const errors: FormError[] = [];

  const visit = (f: ResolvedField, prefix = '') => {
    if (f.rows) return f.rows.forEach((r) => r.fields.forEach((rf) => visit(rf, `${r.label} · `)));
    const err = fieldError(f.def, getIn(values, f.path));
    if (err) errors.push({ path: f.path, sectionId: f.sectionId, label: prefix + f.def.label, ...err });
  };
  resolved.sections.forEach((s) => s.fields.forEach((f) => visit(f)));

  const locate = (fieldId: string) => {
    for (const s of resolved.sections) {
      const f = s.fields.find((x) => x.path === fieldId);
      if (f) return { sectionId: s.def.id, label: f.def.label };
    }
  };
  errors.push(...ruleErrors(def.rules, resolved.record, today, resolved.invalidPaths, locate));
  // Problems that block Save first, then the "Required" ones.
  errors.sort((a, b) => Number(a.kind === 'required') - Number(b.kind === 'required'));

  const outstanding = outstandingSlots(resolved.photoGroups, photos);
  const blocking = errors.filter((e) => e.kind !== 'required');

  return {
    ...resolved,
    errors,
    outstanding,
    canSave: blocking.length === 0,
    canComplete: errors.length === 0 && outstanding.length === 0,
    photosRecord: visiblePhotos(resolved.photoGroups, photos),
  };
}

/** Today's date on the device as YYYY-MM-DD in local time (Asia/Manila on site). Not toISOString(), which is UTC. */
export function localToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
