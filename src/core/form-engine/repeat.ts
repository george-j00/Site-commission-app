import { evaluate, Logic } from './logic';

/**
 * One concept, two uses: ESS unit blocks (repeater field) and EP1..EPn photo
 * slots (repeating photo group) both get their size from a count expression.
 */
export function resolveCount(count: Logic, data: Record<string, unknown>, maxCount: number): number {
  const n = Number(evaluate(count, data));
  if (!Number.isInteger(n) || n < 1) return 0;
  return Math.min(n, maxCount);
}

/** "EP{n}" + 2 → "EP2" (n is 1-based). */
export function fillTemplate(template: string, n: number): string {
  return template.split('{n}').join(String(n));
}
