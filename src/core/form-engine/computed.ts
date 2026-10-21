import { collectVars, evaluate, Logic } from './logic';
import { isEmpty } from './paths';

/**
 * Value of a computed field, or null (shown blank) when any input is missing
 * or invalid — so "panelCount = 0" or empty never shows a misleading 0.00 kW.
 * Never typed by the user and never stored in the draft; it is derived on
 * every evaluation and included in the saved record.
 */
export function computeValue(expr: Logic, data: Record<string, unknown>, invalid: Set<string>): number | string | null {
  for (const name of collectVars(expr)) {
    if (isEmpty(data[name]) || invalid.has(name)) return null;
  }
  const result = evaluate(expr, data);
  if (typeof result === 'number') return Number.isFinite(result) ? result : null;
  if (typeof result === 'string') return result;
  return null;
}
