import raw from '@/core/form-definition/form.v1.json';
import type { Draft } from '../repositories/draftRepository';
import { createFakeExpoSqlite } from '@/test-utils/fakeSqlite';

let mockDb: ReturnType<typeof createFakeExpoSqlite>;
jest.mock('expo-sqlite', () => ({ openDatabaseSync: () => mockDb }));

// Fresh database and fresh module state (cached connection) for every test.
function load() {
  mockDb = createFakeExpoSqlite();
  let mods!: {
    drafts: typeof import('../repositories/draftRepository');
    defs: typeof import('../repositories/definitionRepository');
  };
  jest.isolateModules(() => {
    mods = {
      drafts: require('../repositories/draftRepository'),
      defs: require('../repositories/definitionRepository'),
    };
  });
  return { drafts: mods.drafts.draftRepository, defs: mods.defs.definitionRepository };
}

const draft = (over: Partial<Draft> = {}): Draft => ({
  id: 'd1',
  formId: 'site_commissioning',
  formVersion: '1.0.0',
  values: { panelCount: 12 },
  photos: {},
  status: 'draft',
  updatedAt: '2026-10-19T10:00:00.000Z',
  ...over,
});

describe('draftRepository', () => {
  it('round-trips a draft and upserts by id', () => {
    const { drafts } = load();
    drafts.save(draft());
    drafts.save(draft({ values: { panelCount: 20 }, updatedAt: '2026-10-19T10:05:00.000Z' }));
    expect(drafts.loadOpen('site_commissioning')?.values).toEqual({ panelCount: 20 });
    expect(mockDb.raw.prepare('SELECT COUNT(*) n FROM drafts').get()).toEqual({ n: 1 });
  });

  it('reopens the newest unfinished draft and never a completed one', () => {
    const { drafts } = load();
    drafts.save(draft({ id: 'old', updatedAt: '2026-10-18T00:00:00.000Z' }));
    drafts.save(draft({ id: 'done', status: 'complete', updatedAt: '2026-10-19T12:00:00.000Z' }));
    drafts.save(draft({ id: 'new', updatedAt: '2026-10-19T09:00:00.000Z' }));
    expect(drafts.loadOpen('site_commissioning')?.id).toBe('new');
  });

  it('returns null when there is nothing to reopen', () => {
    expect(load().drafts.loadOpen('site_commissioning')).toBeNull();
  });
});

describe('definitionRepository', () => {
  const putCurrent = (json: string, version: string) =>
    mockDb.raw
      .prepare(`INSERT INTO definitions (form_id, version, json, is_current) VALUES ('site_commissioning', ?, ?, 1)`)
      .run(version, json);

  it('uses the bundled definition when nothing is cached, and stores it for pinned drafts', () => {
    const { defs } = load();
    expect(defs.getDefinition('site_commissioning').version).toBe('1.0.0');
    expect(mockDb.raw.prepare('SELECT version FROM definitions').all()).toEqual([{ version: '1.0.0' }]);
  });

  it('prefers a valid cached newer version', () => {
    const { defs } = load();
    defs.getDefinition('site_commissioning'); // runs migrations
    putCurrent(JSON.stringify({ ...raw, version: '1.1.0', title: 'Updated' }), '1.1.0');
    expect(defs.getDefinition('site_commissioning').title).toBe('Updated');
  });

  it('ignores a cached definition that fails validation and falls back to bundled', () => {
    const { defs } = load();
    defs.getDefinition('site_commissioning');
    const bad = { ...raw, version: '9.9.9', rules: [{ ...raw.rules[0], assert: { eval: ['x'] } }] };
    putCurrent(JSON.stringify(bad), '9.9.9');
    expect(defs.getDefinition('site_commissioning').version).toBe('1.0.0');
  });

  it('returns the exact version a draft was started on', () => {
    const { defs } = load();
    defs.getDefinition('site_commissioning');
    putCurrent(JSON.stringify({ ...raw, version: '1.1.0' }), '1.1.0');
    expect(defs.getDefinitionVersion('site_commissioning', '1.0.0')?.version).toBe('1.0.0');
    expect(defs.getDefinitionVersion('site_commissioning', '1.1.0')?.version).toBe('1.1.0');
    expect(defs.getDefinitionVersion('site_commissioning', '0.0.1')).toBeNull();
  });
});
