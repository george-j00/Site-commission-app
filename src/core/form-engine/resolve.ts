import type {
  FieldDef,
  FormDefinition,
  ItemFieldDef,
  RepeaterFieldDef,
  SectionDef,
} from '@/core/form-definition/schema';
import { computeValue } from './computed';
import { getIn, isEmpty, Values } from './paths';
import { fillTemplate, resolveCount } from './repeat';
import { fieldError } from './validate';
import { isVisible } from './visibility';

export type ResolvedRow = { index: number; label: string; fields: ResolvedField[] };

export type ResolvedField = {
  def: FieldDef | ItemFieldDef;
  path: string;
  sectionId: string;
  rows?: ResolvedRow[]; // repeaters only
};

export type ResolvedSection = { def: SectionDef; fields: ResolvedField[] };

export type ResolvedSlot = { id: string; label: string; groupLabel: string };
export type ResolvedPhotoGroup = { id: string; label: string; slots: ResolvedSlot[] };

export type ResolvedForm = {
  sections: ResolvedSection[];
  photoGroups: ResolvedPhotoGroup[];
  /** Only visible values (+ computed values). This is what Save/Complete stores. */
  record: Values;
  /** Paths whose own value is invalid (not "required"), so rules/computed don't use them. */
  invalidPaths: Set<string>;
};

/**
 * Walk the definition top-down, like a paper form: decide what is visible,
 * expand repeaters and photo slots, compute derived values, and build the
 * pruned record. Expressions see the record built so far, so a field hidden
 * by its parent also hides anything that depends on it. visibleWhen should
 * therefore only reference fields above it.
 *
 * Draft values of hidden fields / extra rows are untouched (the user may
 * toggle back) — they simply don't make it into `record`.
 */
export function resolveForm(def: FormDefinition, values: Values, today: string): ResolvedForm {
  const record: Values = {};
  const invalidPaths = new Set<string>();
  const data = () => ({ ...record, $today: today });

  const takeValue = (f: ItemFieldDef, path: string, target: Values, ctx: Record<string, unknown>) => {
    if (f.type === 'computed') {
      const v = computeValue(f.expr, ctx, invalidPaths);
      if (v !== null) target[f.id] = v;
      return;
    }
    const v = getIn(values, path);
    const err = fieldError(f, v);
    if (err && err.kind !== 'required') invalidPaths.add(path);
    if (!isEmpty(v)) target[f.id] = v;
  };

  const resolveRepeater = (f: RepeaterFieldDef, sectionId: string): ResolvedRow[] => {
    const n = resolveCount(f.count, data(), f.maxCount);
    const rows: ResolvedRow[] = [];
    const recordRows: Values[] = [];
    for (let i = 0; i < n; i++) {
      const rowRecord: Values = {};
      const fields: ResolvedField[] = [];
      for (const item of f.fields) {
        const ctx = { ...data(), ...rowRecord }; // item expressions can see their own row
        if (!isVisible(item, ctx)) continue;
        const path = `${f.id}.${i}.${item.id}`;
        takeValue(item, path, rowRecord, ctx);
        fields.push({ def: item, path, sectionId });
      }
      rows.push({ index: i, label: fillTemplate(f.itemLabel, i + 1), fields });
      recordRows.push(rowRecord);
    }
    record[f.id] = recordRows;
    return rows;
  };

  const sections: ResolvedSection[] = [];
  for (const section of def.sections) {
    if (!isVisible(section, data())) continue;
    const fields: ResolvedField[] = [];
    for (const f of section.fields) {
      if (!isVisible(f, data())) continue;
      if (f.type === 'repeater') {
        fields.push({ def: f, path: f.id, sectionId: section.id, rows: resolveRepeater(f, section.id) });
      } else {
        takeValue(f, f.id, record, data());
        fields.push({ def: f, path: f.id, sectionId: section.id });
      }
    }
    sections.push({ def: section, fields });
  }

  const photoGroups: ResolvedPhotoGroup[] = [];
  for (const g of def.photoGroups) {
    if (!isVisible(g, data())) continue;
    const slots: ResolvedSlot[] = (g.slots ?? []).map((s) => ({ ...s, groupLabel: g.label }));
    if (g.repeat) {
      const n = resolveCount(g.repeat.count, data(), g.repeat.maxCount);
      for (let i = 1; i <= n; i++) {
        slots.push({
          id: fillTemplate(g.repeat.idTemplate, i),
          label: fillTemplate(g.repeat.labelTemplate, i),
          groupLabel: g.label,
        });
      }
    }
    photoGroups.push({ id: g.id, label: g.label, slots });
  }

  return { sections, photoGroups, record, invalidPaths };
}
