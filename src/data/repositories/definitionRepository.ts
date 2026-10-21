import bundled from '@/core/form-definition/form.v1.json';
import { FormDefinition, parseDefinition } from '@/core/form-definition/schema';
import { getDb } from '@/data/db/client';

/**
 * Where form definitions come from. The UI never imports form.v1.json
 * directly, so swapping in a real remote fetch touches only this file.
 *
 * Rules:
 *  - Cold start never waits on the network: cached or bundled, instantly.
 *  - Nothing is used until it passes parseDefinition (zod + schemaVersion +
 *    known operators). A bad file is rejected and the previous one kept.
 *  - New versions are stored first, then marked current (atomic swap).
 *  - A draft stays on the version it started with (getDefinitionVersion).
 */
export interface DefinitionRepository {
  getDefinition(formId: string): FormDefinition;
  getDefinitionVersion(formId: string, version: string): FormDefinition | null;
  refresh(formId: string): Promise<void>;
}

const bundledDefinition = parseDefinition(bundled);

function readStored(formId: string, version?: string): string | null {
  const row = version
    ? getDb().getFirstSync<{ json: string }>(
        `SELECT json FROM definitions WHERE form_id = ? AND version = ?`,
        formId,
        version,
      )
    : getDb().getFirstSync<{ json: string }>(
        `SELECT json FROM definitions WHERE form_id = ? AND is_current = 1`,
        formId,
      );
  return row?.json ?? null;
}

/** Store a definition version; optionally make it current in the same transaction (atomic swap). */
function store(formId: string, version: string, json: string, makeCurrent: boolean): void {
  const d = getDb();
  d.withTransactionSync(() => {
    d.runSync(`INSERT OR IGNORE INTO definitions (form_id, version, json) VALUES (?, ?, ?)`, formId, version, json);
    if (makeCurrent) {
      d.runSync(`UPDATE definitions SET is_current = (version = ?) WHERE form_id = ?`, version, formId);
    }
  });
}

function tryParse(json: string | null): FormDefinition | null {
  if (!json) return null;
  try {
    return parseDefinition(JSON.parse(json));
  } catch {
    return null;
  }
}

export const definitionRepository: DefinitionRepository = {
  /** Newest valid cached definition, else the bundled one. */
  getDefinition(formId) {
    // Always keep the bundled version on file so drafts started on it can be reopened.
    store(bundledDefinition.formId, bundledDefinition.version, JSON.stringify(bundled), false);
    const cached = tryParse(readStored(formId));
    if (cached) return cached;
    if (formId !== bundledDefinition.formId) throw new Error(`No definition for ${formId}`);
    return bundledDefinition;
  },

  getDefinitionVersion(formId, version) {
    if (formId === bundledDefinition.formId && version === bundledDefinition.version) return bundledDefinition;
    return tryParse(readStored(formId, version));
  },

  /**
   * Stub. When online (NetInfo), in the background:
   *   GET /forms/{formId}/current (If-None-Match: etag)
   *   → parseDefinition(json)  — throws on anything unknown; caught, logged, old one kept
   *   → store(formId, def.version, json, true)
   * Never throws to the UI. New definitions apply to new forms only.
   */
  async refresh(_formId) {},
};
