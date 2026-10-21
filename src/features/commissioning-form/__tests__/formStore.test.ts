import type { Draft } from '@/data/repositories/draftRepository';
import { useFormStore } from '../store/formStore';

// jest.mock calls below are hoisted above these imports by babel-jest.

// In-memory stand-ins for storage: the store's behaviour is what's under test here.
const mockSaved = new Map<string, Draft>();
jest.mock('@/data/repositories/draftRepository', () => ({
  draftRepository: {
    save: (d: Draft) => mockSaved.set(d.id, d),
    loadOpen: () => [...mockSaved.values()].find((d) => d.status !== 'complete') ?? null,
  },
}));
jest.mock('@/data/repositories/definitionRepository', () => {
  const { parseDefinition } = jest.requireActual('@/core/form-definition/schema');
  const def = parseDefinition(jest.requireActual('@/core/form-definition/form.v1.json'));
  return {
    definitionRepository: {
      getDefinition: () => def,
      getDefinitionVersion: (_: string, v: string) => (v === def.version ? def : null),
    },
  };
});
let mockUuid = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));

const store = () => useFormStore.getState();
const ALL_PHOTOS = ['excavation', 'steelBinding', 'raftColumn', 'boltsPedestal', 'front', 'side', 'ep1'];
const fillValid = () => {
  const set = store().setValue;
  set('contractorMobilisedDate', '2026-10-01');
  set('foundationStart', '2026-10-02');
  set('foundationEnd', '2026-10-05');
  set('earthingWorks', true);
  set('earthingType', 'Pipe');
  set('earthingNos', 1);
  set('ess', false);
  set('panelCapacity', 585);
  set('panelCount', 12);
};

beforeEach(() => {
  mockSaved.clear();
  useFormStore.setState({
    def: null,
    draft: null,
    restored: false,
    initError: null,
    touched: {},
    showAllErrors: false,
  });
});

describe('formStore', () => {
  it('starts a new draft with a device uuid when nothing is stored', () => {
    store().init('site_commissioning');
    expect(store().draft).toMatchObject({ status: 'draft', formVersion: '1.0.0', values: {} });
    expect(store().draft!.id).toMatch(/^uuid-/);
    expect(store().restored).toBe(false);
  });

  it('restores an open draft on its pinned definition version', () => {
    store().init('site_commissioning');
    store().setValue('panelCount', 7);
    mockSaved.set(store().draft!.id, store().draft!);
    useFormStore.setState({ draft: null });
    store().init('site_commissioning');
    expect(store().restored).toBe(true);
    expect(store().draft!.values.panelCount).toBe(7);
  });

  it('records an init failure instead of throwing', () => {
    const repo = jest.requireMock('@/data/repositories/draftRepository').draftRepository;
    const orig = repo.loadOpen;
    repo.loadOpen = () => {
      throw new Error('disk full');
    };
    store().init('site_commissioning');
    expect(store().initError).toBe('disk full');
    repo.loadOpen = orig;
  });

  it('Save is blocked by a broken rule and leaves the draft unsaved', () => {
    store().init('site_commissioning');
    store().setValue('foundationStart', '2026-10-10');
    store().setValue('foundationEnd', '2026-10-01');
    const ev = store().save();
    expect(ev.canSave).toBe(false);
    expect(store().draft!.status).toBe('draft');
    expect(store().draft!.saved).toBeUndefined();
    expect(store().showAllErrors).toBe(true);
  });

  it('Save commits a pruned record: hidden values stay in the draft, not in the record', () => {
    store().init('site_commissioning');
    store().setValue('earthingWorks', true);
    store().setValue('earthingType', 'Pipe');
    store().setValue('earthingWorks', false);
    store().save();
    expect(store().draft!.status).toBe('saved');
    expect(store().draft!.values.earthingType).toBe('Pipe');
    expect(store().draft!.saved!.record.earthingType).toBeUndefined();
  });

  it('editing after Save marks the draft as changed again', () => {
    store().init('site_commissioning');
    store().save();
    store().setValue('panelCount', 3);
    expect(store().draft!.status).toBe('draft');
    expect(store().touched.panelCount).toBe(true);
  });

  it('Complete needs every photo; then the form is locked', () => {
    store().init('site_commissioning');
    fillValid();
    ALL_PHOTOS.slice(1).forEach((id) => store().setPhoto(id, true));
    const blocked = store().complete();
    expect(blocked.outstanding.map((s) => s.label)).toEqual(['Excavation']);
    expect(store().draft!.status).toBe('draft');

    store().setPhoto('excavation', true);
    expect(store().complete().canComplete).toBe(true);
    expect(store().draft!.status).toBe('complete');
    expect(store().draft!.saved!.record.pvCapacity).toBe(7.02);

    store().setValue('panelCount', 99);
    expect(store().draft!.values.panelCount).toBe(12);
  });

  it('newForm starts fresh with a new id', () => {
    store().init('site_commissioning');
    const first = store().draft!.id;
    store().newForm();
    expect(store().draft!.id).not.toBe(first);
    expect(store().draft!.values).toEqual({});
  });
});
