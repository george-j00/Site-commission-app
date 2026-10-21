import type { FieldDef, ItemFieldDef, RuleDef } from '@/core/form-definition/schema';
import { collectVars, evaluate } from './logic';
import { getIn, isEmpty, Values } from './paths';

export type ErrorKind =
  | 'required' // empty required field — blocks Complete only (a half-filled draft can be saved)
  | 'invalid' // value breaks its own field constraint (not a number, below min, ...) — blocks Save
  | 'rule'; // a cross-field rule from the definition is broken — blocks Save

export type FormError = {
  path: string; // where to show it, e.g. "foundationEnd" or "essUnits.1.serialNo"
  sectionId: string;
  label: string; // field label for the summary, e.g. "ESS Unit 2 · Serial No"
  kind: ErrorKind;
  message: string;
  ruleId?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Constraint check for one field's own value. Dates are YYYY-MM-DD strings. */
export function fieldError(def: FieldDef | ItemFieldDef, value: unknown): { kind: ErrorKind; message: string } | null {
  if (def.type === 'computed' || def.type === 'repeater') return null;
  if (isEmpty(value)) return def.required ? { kind: 'required', message: 'Required' } : null;

  switch (def.type) {
    case 'date':
      return typeof value === 'string' && DATE_RE.test(value) ? null : { kind: 'invalid', message: 'Not a valid date' };
    case 'yesno':
      return typeof value === 'boolean' ? null : { kind: 'invalid', message: 'Choose Yes or No' };
    case 'select':
      // Options can change remotely; an old draft value that is no longer offered must be re-picked.
      return def.options.includes(value as string | number)
        ? null
        : { kind: 'invalid', message: 'Pick one of the options' };
    case 'text':
      return def.maxLength && String(value).length > def.maxLength
        ? { kind: 'invalid', message: `At most ${def.maxLength} characters` }
        : null;
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return { kind: 'invalid', message: 'Must be a number' };
      if (def.integer && !Number.isInteger(value)) return { kind: 'invalid', message: 'Must be a whole number' };
      if (def.min !== undefined && value < def.min) return { kind: 'invalid', message: `Must be at least ${def.min}` };
      if (def.max !== undefined && value > def.max) return { kind: 'invalid', message: `Must be at most ${def.max}` };
      return null;
    }
  }
}

/**
 * Evaluate cross-field rules against the pruned record (hidden fields already
 * removed). A rule is skipped until every value it depends on exists and is
 * itself valid: an empty date is a "Required" problem, not "end before start".
 */
export function ruleErrors(
  rules: RuleDef[],
  record: Values,
  today: string,
  invalidPaths: Set<string>,
  locate: (fieldId: string) => { sectionId: string; label: string } | undefined,
): FormError[] {
  const errors: FormError[] = [];
  const data = { ...record, $today: today };
  for (const rule of rules) {
    const at = locate(rule.field);
    if (!at) continue; // target field is hidden
    const deps = new Set(rule.dependsOn ?? collectVars(rule.assert));
    deps.add(rule.field);
    const ready = [...deps].every((d) => !isEmpty(getIn(record, d)) && !invalidPaths.has(d));
    if (!ready) continue;
    if (!evaluate(rule.assert, data)) {
      errors.push({ path: rule.field, ...at, kind: 'rule', message: rule.message, ruleId: rule.id });
    }
  }
  return errors;
}
