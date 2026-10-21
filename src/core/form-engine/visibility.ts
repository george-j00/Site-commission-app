import { evaluate, Logic } from './logic';

/** A node with no visibleWhen is always shown; otherwise its expression must be truthy. */
export function isVisible(node: { visibleWhen?: Logic }, data: Record<string, unknown>): boolean {
  if (node.visibleWhen === undefined) return true;
  return Boolean(evaluate(node.visibleWhen, data));
}
