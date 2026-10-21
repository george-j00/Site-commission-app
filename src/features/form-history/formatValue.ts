import type { FieldDef, ItemFieldDef } from '@/core/form-definition/schema';
import { isEmpty } from '@/core/form-engine/paths';
import { formatYmd } from '@/shared/format';

/** A stored value as a worker would read it: "Yes", "Mon, 19 Oct 2026", "585 W", "7.02 kW". Null when empty. */
export function formatValue(def: FieldDef | ItemFieldDef, value: unknown): string | null {
  if (isEmpty(value)) return null;
  const unit = 'unit' in def && def.unit ? ` ${def.unit}` : '';
  switch (def.type) {
    case 'yesno':
      return value === true ? 'Yes' : value === false ? 'No' : String(value);
    case 'date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatYmd(value) : String(value);
    case 'computed':
      return (typeof value === 'number' ? value.toFixed(2) : String(value)) + unit;
    default:
      return String(value) + unit;
  }
}
