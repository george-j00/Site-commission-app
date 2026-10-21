import type { Photos } from '@/core/form-engine/completeness';
import type { Values } from '@/core/form-engine/paths';
import { getDb } from '@/data/db/client';

export type DraftStatus = 'draft' | 'saved' | 'complete';

export type Draft = {
  id: string; // uuid made on device — the future sync idempotency key
  formId: string;
  formVersion: string; // definition the draft was started on (pinned)
  values: Values; // everything typed, including currently-hidden values
  photos: Photos; // { excavation: { capturedAt }, ep2: { ... } }
  status: DraftStatus;
  /** Last validated commit (Save/Complete): pruned values + visible photos only. */
  saved?: { at: string; record: Values; photos: Photos };
  updatedAt: string;
};

/**
 * Where drafts live. The store only talks to this interface, so the storage
 * (and later an outbox for sync) can change without touching the UI.
 */
export interface DraftRepository {
  save(draft: Draft): void;
  /** Most recent form that isn't finished yet — what the app reopens on. */
  loadOpen(formId: string): Draft | null;
  /** Every form on this phone, newest first (history screen). */
  list(formId: string): Draft[];
  get(id: string): Draft | null;
}

export const draftRepository: DraftRepository = {
  /** Single-row upsert: SQLite makes it atomic, so a kill mid-write leaves the previous version intact. */
  save(d) {
    getDb().runSync(
      `INSERT INTO drafts (id, form_id, form_version, data_json, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, status = excluded.status, updated_at = excluded.updated_at`,
      d.id,
      d.formId,
      d.formVersion,
      JSON.stringify(d),
      d.status,
      d.updatedAt,
    );
  },

  loadOpen(formId) {
    const row = getDb().getFirstSync<{ data_json: string }>(
      `SELECT data_json FROM drafts WHERE form_id = ? AND status != 'complete' ORDER BY updated_at DESC LIMIT 1`,
      formId,
    );
    return row ? (JSON.parse(row.data_json) as Draft) : null;
  },

  list(formId) {
    return getDb()
      .getAllSync<{ data_json: string }>(
        `SELECT data_json FROM drafts WHERE form_id = ? ORDER BY updated_at DESC`,
        formId,
      )
      .map((r) => JSON.parse(r.data_json) as Draft);
  },

  get(id) {
    const row = getDb().getFirstSync<{ data_json: string }>(`SELECT data_json FROM drafts WHERE id = ?`, id);
    return row ? (JSON.parse(row.data_json) as Draft) : null;
  },
};
