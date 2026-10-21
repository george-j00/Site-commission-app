import jsonLogic, { RulesLogic } from 'json-logic-js';

/**
 * The only place JSON Logic is touched. Everything conditional in the form
 * definition (visibility, counts, computed values, rules) goes through here.
 *
 * Adding an operator is a CODE change (needs an app release + a schemaVersion
 * bump if old apps would misread forms that use it). Using an existing one is
 * a JSON-only change.
 */

export type Logic = unknown;

/** round(x, decimals) — JSON Logic has no rounding. Non-numbers give null so computed fields stay blank. */
jsonLogic.add_operation('round', (x: unknown, decimals: unknown = 0) => {
  if (typeof x !== 'number' || !Number.isFinite(x)) return null;
  const f = 10 ** Number(decimals);
  return Math.round((x + Number.EPSILON) * f) / f;
});

/** unique(list) — true when no two non-empty entries are equal (trimmed, case-insensitive). For serial numbers. */
jsonLogic.add_operation('unique', (list: unknown) => {
  if (!Array.isArray(list)) return true;
  const seen = new Set<string>();
  for (const item of list) {
    if (item === null || item === undefined || item === '') continue;
    const key = String(item).trim().toLowerCase();
    if (key === '') continue;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
});

/** Operators a definition may use. A remote file using anything else is rejected at load. */
export const SUPPORTED_OPS = new Set([
  // standard json-logic-js
  'var',
  'missing',
  'missing_some',
  'if',
  '?:',
  '==',
  '===',
  '!=',
  '!==',
  '!',
  '!!',
  'or',
  'and',
  '>',
  '>=',
  '<',
  '<=',
  'max',
  'min',
  '+',
  '-',
  '*',
  '/',
  '%',
  'map',
  'filter',
  'reduce',
  'all',
  'none',
  'some',
  'merge',
  'in',
  'cat',
  'substr',
  // custom (registered above)
  'round',
  'unique',
]);

/** Ops whose later arguments run against each array item, not the form values. */
const ITERATING_OPS = new Set(['map', 'filter', 'reduce', 'all', 'none', 'some']);

export function evaluate(expr: Logic, data: Record<string, unknown>): unknown {
  return jsonLogic.apply(expr as RulesLogic, data);
}

function opOf(expr: unknown): string | null {
  if (expr === null || typeof expr !== 'object' || Array.isArray(expr)) return null;
  const keys = Object.keys(expr);
  return keys.length === 1 ? keys[0] : null;
}

function argsOf(expr: object, op: string): unknown[] {
  const a = (expr as Record<string, unknown>)[op];
  return Array.isArray(a) ? a : [a];
}

/** Every operator used in an expression (for load-time validation). */
export function collectOps(expr: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(expr)) {
    expr.forEach((e) => collectOps(e, out));
  } else {
    const op = opOf(expr);
    if (op) {
      out.add(op);
      argsOf(expr as object, op).forEach((a) => collectOps(a, out));
    }
  }
  return out;
}

/**
 * Top-level variable names an expression reads, e.g. foundationEnd, foundationStart.
 * Used to skip a rule until its inputs exist and to keep computed fields blank.
 * Skips the per-item arguments of map/filter/etc. (their vars refer to the item),
 * and $-prefixed engine values like $today.
 */
export function collectVars(expr: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(expr)) {
    expr.forEach((e) => collectVars(e, out));
    return out;
  }
  const op = opOf(expr);
  if (!op) return out;
  const args = argsOf(expr as object, op);
  if (op === 'var') {
    const name = args[0];
    if (typeof name === 'string' && name !== '' && !name.startsWith('$')) out.add(name.split('.')[0]);
    return out;
  }
  if (ITERATING_OPS.has(op)) {
    collectVars(args[0], out);
    return out;
  }
  args.forEach((a) => collectVars(a, out));
  return out;
}
