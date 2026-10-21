/**
 * Values are stored by field id; repeater rows live in arrays, so a path is
 * "panelCount" or "essUnits.2.serialNo".
 */

export type Values = Record<string, unknown>;

export function getIn(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

type Container = Record<string, unknown> | unknown[];

/** Immutable set; creates arrays for numeric keys, objects otherwise. */
export function setIn<T extends Container>(obj: T, path: string, value: unknown): T {
  const [key, ...rest] = path.split('.');
  // Index access on a copy; arrays accept numeric-string keys at runtime.
  const container = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string, unknown>;
  if (rest.length === 0) {
    if (value === undefined) delete container[key];
    else container[key] = value;
    return container as T;
  }
  const child = container[key];
  const empty: Container = /^\d+$/.test(rest[0]) ? [] : {};
  container[key] = setIn(
    child !== null && typeof child === 'object' ? (child as Container) : empty,
    rest.join('.'),
    value,
  );
  return container as T;
}

export function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}
