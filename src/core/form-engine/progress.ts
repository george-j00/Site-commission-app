import type { Photos } from './completeness';
import type { Evaluation } from './form';
import { getIn, isEmpty, Values } from './paths';
import type { ResolvedField } from './resolve';

/** Fillable leaf fields (repeater rows flattened, computed fields excluded). */
export function leafFields(fields: ResolvedField[]): ResolvedField[] {
  return fields.flatMap((f) =>
    f.rows ? f.rows.flatMap((r) => leafFields(r.fields)) : f.def.type === 'computed' ? [] : [f],
  );
}

/** A field counts as done when it has a value and no error of any kind. */
export function isFieldDone(f: ResolvedField, values: Values, errorPaths: Set<string>): boolean {
  return !isEmpty(getIn(values, f.path)) && !errorPaths.has(f.path);
}

/**
 * Overall progress of a form: done visible fields + captured visible photo
 * slots, over the totals. Used by the header and the history list.
 */
export function formProgress(ev: Evaluation, values: Values, photos: Photos) {
  const errorPaths = new Set(ev.errors.map((e) => e.path));
  const fields = ev.sections.flatMap((s) => leafFields(s.fields));
  const slots = ev.photoGroups.flatMap((g) => g.slots);
  const fieldsDone = fields.filter((f) => isFieldDone(f, values, errorPaths)).length;
  const photosDone = slots.filter((s) => photos[s.id]).length;
  const total = fields.length + slots.length;
  return {
    fieldsDone,
    fieldsTotal: fields.length,
    photosDone,
    photosTotal: slots.length,
    ratio: total ? (fieldsDone + photosDone) / total : 0,
  };
}
