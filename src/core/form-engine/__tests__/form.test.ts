import raw from '@/core/form-definition/form.v1.json';
import { parseDefinition } from '@/core/form-definition/schema';
import { evaluateForm, localToday } from '@/core/form-engine/form';
import { evaluate } from '@/core/form-engine/logic';
import { setIn } from '@/core/form-engine/paths';

const def = parseDefinition(raw);
const TODAY = '2026-10-19';
const run = (values: Record<string, unknown>, photos = {}) => evaluateForm(def, values, photos, TODAY);
const ruleIds = (values: Record<string, unknown>) =>
  run(values)
    .errors.filter((e) => e.kind === 'rule')
    .map((e) => e.ruleId);
const visibleIds = (values: Record<string, unknown>) =>
  run(values).sections.flatMap((s) => s.fields.map((f) => f.path));
const slotIds = (values: Record<string, unknown>) => run(values).photoGroups.flatMap((g) => g.slots.map((s) => s.id));

describe('date rules', () => {
  it('rejects future dates', () => {
    expect(ruleIds({ contractorMobilisedDate: '2026-10-20' })).toContain('mobilised_not_future');
    expect(ruleIds({ foundationStart: '2027-01-01' })).toContain('start_not_future');
    expect(ruleIds({ foundationEnd: '2026-12-31' })).toContain('end_not_future');
    expect(ruleIds({ contractorMobilisedDate: TODAY })).toEqual([]);
  });

  it('end cannot be before start, and the error sits on the end field', () => {
    const errs = run({ foundationStart: '2026-10-10', foundationEnd: '2026-10-09' }).errors.filter(
      (e) => e.kind === 'rule',
    );
    expect(errs).toEqual([
      expect.objectContaining({ ruleId: 'end_after_start', path: 'foundationEnd', sectionId: 'construction' }),
    ]);
    expect(ruleIds({ foundationStart: '2026-10-10', foundationEnd: '2026-10-10' })).toEqual([]);
  });

  it('start cannot be before mobilised', () => {
    expect(ruleIds({ contractorMobilisedDate: '2026-10-05', foundationStart: '2026-10-04' })).toEqual([
      'start_after_mobilised',
    ]);
  });

  it('does not fire range rules while a date is empty (that is just "Required")', () => {
    expect(ruleIds({ foundationEnd: '2026-10-01' })).toEqual([]);
    const e = run({ foundationEnd: '2026-10-01' }).errors.find((x) => x.path === 'foundationStart');
    expect(e?.kind).toBe('required');
  });

  it('broken rules block Save; empty required fields do not', () => {
    expect(run({ foundationStart: '2026-10-10' }).canSave).toBe(true);
    expect(run({ foundationStart: '2026-10-10', foundationEnd: '2026-10-01' }).canSave).toBe(false);
  });
});

describe('earthing', () => {
  it('No hides type, nos and the earthing photo group', () => {
    expect(visibleIds({ earthingWorks: false })).not.toContain('earthingType');
    expect(slotIds({ earthingWorks: false, earthingNos: 3 })).not.toContain('ep1');
  });

  it('Earthing Nos drives EP1..EPn', () => {
    expect(slotIds({ earthingWorks: true, earthingNos: 3 })).toEqual(expect.arrayContaining(['ep1', 'ep2', 'ep3']));
    expect(slotIds({ earthingWorks: true, earthingNos: 1 })).not.toContain('ep2');
    const labels = run({ earthingWorks: true, earthingNos: 2 })
      .photoGroups.find((g) => g.id === 'earthing')!
      .slots.map((s) => s.label);
    expect(labels).toEqual(['EP1', 'EP2']);
  });

  it('hidden values stay in the draft but are pruned from the record', () => {
    const r = run({ earthingWorks: false, earthingType: 'Pipe' });
    expect(r.record.earthingType).toBeUndefined();
  });
});

describe('ESS units', () => {
  it('count drives the number of blocks, extra rows are dropped from the record', () => {
    let values: Record<string, unknown> = { ess: true, essCount: 5 };
    for (let i = 0; i < 5; i++) values = setIn(values, `essUnits.${i}.make`, `M${i}`);
    const units = (v: Record<string, unknown>) => run(v).sections[1].fields.find((f) => f.path === 'essUnits')!.rows!;
    expect(units(values)).toHaveLength(5);
    expect(units(values)[4].label).toBe('ESS Unit 5');
    const two = { ...values, essCount: 2 };
    expect(units(two)).toHaveLength(2);
    expect(run(two).record.essUnits).toEqual([{ make: 'M0' }, { make: 'M1' }]);
    // rows 3-5 no longer produce "Required" errors
    expect(
      run(two)
        .errors.filter((e) => e.path.startsWith('essUnits.'))
        .map((e) => e.path),
    ).toEqual(['essUnits.0.serialNo', 'essUnits.1.serialNo']);
  });
});

describe('PV capacity', () => {
  it('585 W x 12 = 7.02 kW', () => {
    expect(run({ panelCapacity: 585, panelCount: 12 }).record.pvCapacity).toBe(7.02);
  });
  it('rounds to two decimals as a number', () => {
    expect(run({ panelCapacity: 575, panelCount: 3 }).record.pvCapacity).toBe(1.73); // 1.725
  });
  it('is blank when an input is missing or invalid', () => {
    expect(run({ panelCapacity: 585 }).record.pvCapacity).toBeUndefined();
    expect(run({ panelCapacity: 585, panelCount: 0 }).record.pvCapacity).toBeUndefined();
    expect(run({ panelCapacity: 585, panelCount: 0 }).errors.find((e) => e.path === 'panelCount')?.message).toBe(
      'Must be at least 1',
    );
  });
});

describe('completeness', () => {
  it('lists outstanding photo slots and blocks Complete', () => {
    const r = run({ earthingWorks: true, earthingNos: 2 }, { excavation: { capturedAt: 'x' } });
    expect(r.outstanding.map((s) => s.label)).toContain('EP2');
    expect(r.outstanding.map((s) => s.id)).not.toContain('excavation');
    expect(r.canComplete).toBe(false);
  });

  it('a fully filled form can be completed', () => {
    const values = {
      contractorMobilisedDate: '2026-10-01',
      foundationStart: '2026-10-02',
      foundationEnd: '2026-10-05',
      earthingWorks: true,
      earthingType: 'Pipe',
      earthingNos: 1,
      ess: true,
      essCount: 1,
      essUnits: [{ make: 'BYD', serialNo: 'S1' }],
      panelCapacity: 590,
      panelCount: 10,
    };
    const photos = Object.fromEntries(
      ['excavation', 'steelBinding', 'raftColumn', 'boltsPedestal', 'front', 'side', 'ep1'].map((id) => [
        id,
        { capturedAt: 't' },
      ]),
    );
    const r = run(values, photos);
    expect(r.errors).toEqual([]);
    expect(r.canComplete).toBe(true);
    expect(r.record.pvCapacity).toBe(5.9);
  });
});

describe('definition loading', () => {
  it('rejects unknown operators and unsupported schema versions', () => {
    expect(() => parseDefinition({ ...raw, schemaVersion: 2 })).toThrow(/schemaVersion/);
    const bad = setIn(raw, 'rules.0.assert', { eval: ['x'] });
    expect(() => parseDefinition(bad)).toThrow(/unsupported logic operator "eval"/);
  });
});

describe('custom operators', () => {
  it('unique detects duplicate serials (trimmed, case-insensitive), ignoring blanks', () => {
    expect(evaluate({ unique: [['A1', 'a1 ']] }, {})).toBe(false);
    expect(evaluate({ unique: [['A1', 'B2', '', null]] }, {})).toBe(true);
  });
});

it('localToday uses local time, not UTC', () => {
  expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
});
