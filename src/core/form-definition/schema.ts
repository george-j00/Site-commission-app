import { z } from 'zod';
import { collectOps, SUPPORTED_OPS } from '@/core/form-engine/logic';

/**
 * Shape of a form definition. Anything that fails this is rejected, so a bad
 * remote file can never reach the renderer. Types are inferred from here.
 */

/** Structure versions this build of the app understands. Bump when adding a field type. */
export const SUPPORTED_SCHEMA_VERSIONS = [1] as const;

const id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'ids must be identifiers (letters, digits, _)');
const logic = z.unknown();
const optionValue = z.union([z.string(), z.number()]);

const base = {
  id,
  label: z.string().min(1),
  required: z.boolean().optional(),
  visibleWhen: logic.optional(),
  help: z.string().optional(),
};

const dateField = z.object({ ...base, type: z.literal('date') });
const yesNoField = z.object({ ...base, type: z.literal('yesno') });
const selectField = z.object({
  ...base,
  type: z.literal('select'),
  options: z.array(optionValue).min(1),
  unit: z.string().optional(),
});
const numberField = z.object({
  ...base,
  type: z.literal('number'),
  integer: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
});
const textField = z.object({ ...base, type: z.literal('text'), maxLength: z.number().int().positive().optional() });
const computedField = z.object({ ...base, type: z.literal('computed'), expr: logic, unit: z.string().optional() });

/** Fields allowed inside a repeater block (no nested repeaters). */
const itemField = z.discriminatedUnion('type', [
  dateField,
  yesNoField,
  selectField,
  numberField,
  textField,
  computedField,
]);

const repeaterField = z.object({
  ...base,
  type: z.literal('repeater'),
  itemLabel: z.string().min(1), // "ESS Unit {n}"
  count: logic, // how many blocks to show
  maxCount: z.number().int().positive().default(50),
  fields: z.array(itemField).min(1),
});

const field = z.discriminatedUnion('type', [
  dateField,
  yesNoField,
  selectField,
  numberField,
  textField,
  computedField,
  repeaterField,
]);

const section = z.object({
  id,
  title: z.string().min(1),
  visibleWhen: logic.optional(),
  fields: z.array(field),
});

const photoSlot = z.object({ id, label: z.string().min(1) });

const photoGroup = z
  .object({
    id,
    label: z.string().min(1),
    visibleWhen: logic.optional(),
    slots: z.array(photoSlot).optional(),
    /** Generated slots: count → ids/labels from templates, e.g. ep1..epN / EP1..EPN. */
    repeat: z
      .object({
        count: logic,
        idTemplate: z.string().includes('{n}'),
        labelTemplate: z.string().includes('{n}'),
        maxCount: z.number().int().positive().default(50),
      })
      .optional(),
  })
  .refine((g) => g.slots || g.repeat, { message: 'photo group needs slots or repeat' });

const rule = z.object({
  id,
  /** Field the error is shown on. */
  field: id,
  /** Must be truthy, or the rule is broken. */
  assert: logic,
  message: z.string().min(1),
  /** Rule is skipped until these have values. Defaults to the vars the assert reads. */
  dependsOn: z.array(z.string()).optional(),
});

export const formDefinitionSchema = z
  .object({
    formId: id,
    version: z.string().min(1),
    schemaVersion: z.number().int(),
    title: z.string().optional(),
    photoSectionTitle: z.string().default('Photos'),
    sections: z.array(section).min(1),
    photoGroups: z.array(photoGroup).default([]),
    rules: z.array(rule).default([]),
  })
  .superRefine((def, ctx) => {
    if (!(SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(def.schemaVersion)) {
      ctx.addIssue({ code: 'custom', message: `schemaVersion ${def.schemaVersion} not supported by this app` });
    }

    // Field ids are the storage keys for drafts, so they must be unique.
    const fieldIds = new Set<string>();
    for (const s of def.sections) {
      for (const f of s.fields) {
        if (fieldIds.has(f.id)) ctx.addIssue({ code: 'custom', message: `duplicate field id "${f.id}"` });
        fieldIds.add(f.id);
      }
    }
    for (const r of def.rules) {
      if (!fieldIds.has(r.field))
        ctx.addIssue({ code: 'custom', message: `rule "${r.id}" targets unknown field "${r.field}"` });
    }

    // Every operator used in any logic expression must be one the engine knows.
    const exprs: unknown[] = [];
    for (const s of def.sections) {
      exprs.push(s.visibleWhen);
      for (const f of s.fields) {
        exprs.push(f.visibleWhen);
        if (f.type === 'computed') exprs.push(f.expr);
        if (f.type === 'repeater') {
          exprs.push(f.count);
          for (const i of f.fields) exprs.push(i.visibleWhen, i.type === 'computed' ? i.expr : undefined);
        }
      }
    }
    for (const g of def.photoGroups) exprs.push(g.visibleWhen, g.repeat?.count);
    for (const r of def.rules) exprs.push(r.assert);
    const ops = collectOps(exprs);
    for (const op of ops) {
      if (!SUPPORTED_OPS.has(op)) ctx.addIssue({ code: 'custom', message: `unsupported logic operator "${op}"` });
    }
  });

export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type SectionDef = FormDefinition['sections'][number];
export type FieldDef = SectionDef['fields'][number];
export type ItemFieldDef = z.infer<typeof itemField>;
export type RepeaterFieldDef = z.infer<typeof repeaterField>;
export type PhotoGroupDef = FormDefinition['photoGroups'][number];
export type RuleDef = FormDefinition['rules'][number];

/** Parse unknown JSON into a definition, or throw with a readable reason. */
export function parseDefinition(json: unknown): FormDefinition {
  const result = formDefinitionSchema.safeParse(json);
  if (!result.success) {
    throw new Error('Invalid form definition: ' + result.error.issues.map((i) => i.message).join('; '));
  }
  return result.data;
}
