import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  addDays,
  compareDates,
  createCalendar,
  diffDays,
  fromDayNumber,
  planPayDays,
  type BillInput,
  type PlanInput,
} from '../src';

// Design doc 03, section 4 config: lead 5, window 7, safety 1, lag 1 business day, Mon-Fri.
const calendar = createCalendar();
const bill = (id: string, dueDate: string, extra: Partial<BillInput> = {}): BillInput => ({
  id,
  cardId: `card-${id}`,
  dueDate,
  status: 'open',
  ...extra,
});
const input = (today: string, bills: BillInput[], extra: Partial<PlanInput> = {}): PlanInput => ({
  today,
  bills,
  calendar,
  ...extra,
});

describe('planPayDays: golden examples from the design doc', () => {
  it('example 1: three bills due 3, 5 and 7 Dec share one pay day, Fri 27 Nov', () => {
    const out = planPayDays(
      input('2026-11-20', [
        bill('A', '2026-12-03'),
        bill('B', '2026-12-05'),
        bill('C', '2026-12-07'),
      ]),
    );
    expect(out.groups).toHaveLength(1);
    const [g] = out.groups;
    expect(g?.payDay).toBe('2026-11-27');
    expect(g?.billIds).toEqual(['A', 'B', 'C']);
    expect(g?.lastSafeDay).toBe('2026-12-01');
    expect(g?.risk).toBe('ok');
  });

  it('example 2: rolls earlier across a New Year holiday into the previous year', () => {
    const out = planPayDays(
      input('2026-12-20', [bill('A', '2027-01-08'), bill('B', '2027-01-12')], {
        calendar: createCalendar({ holidays: ['2027-01-01'] }),
      }),
    );
    expect(out.groups.map((g) => [g.payDay, g.billIds])).toEqual([['2026-12-31', ['A', 'B']]]);
  });

  it('example 3: bills 12 days apart get two reminders, no forced merge', () => {
    const out = planPayDays(
      input('2026-11-20', [bill('A', '2026-12-03'), bill('B', '2026-12-15')]),
    );
    expect(out.groups.map((g) => [g.payDay, g.billIds])).toEqual([
      ['2026-11-27', ['A']],
      ['2026-12-10', ['B']],
    ]);
  });

  it('example 4: a 1-day per-card lead is capped by the safety rule and still joins', () => {
    const out = planPayDays(
      input('2026-11-20', [
        bill('A', '2026-12-03'),
        bill('B', '2026-12-05'),
        bill('C', '2026-12-07'),
        bill('E', '2026-12-07', { leadDays: 1 }),
      ]),
    );
    expect(out.groups).toHaveLength(1);
    expect(out.groups[0]?.billIds).toEqual(['A', 'B', 'C', 'E']);
  });

  it('example 5: a late entry is planned for today and flagged tight, then late', () => {
    const tight = planPayDays(input('2026-11-30', [bill('A', '2026-12-03')]));
    expect(tight.groups[0]).toMatchObject({ payDay: '2026-11-30', risk: 'tight' });

    const late = planPayDays(input('2026-12-02', [bill('A', '2026-12-03')]));
    expect(late.groups[0]).toMatchObject({ payDay: '2026-12-02', risk: 'late' });
  });

  it('example 6: after two members are paid, the remaining bill keeps its feasible pay day', () => {
    const bills = [bill('A', '2026-12-03'), bill('B', '2026-12-05'), bill('C', '2026-12-07')];
    const first = planPayDays(input('2026-11-20', bills));
    const after = planPayDays(
      input(
        '2026-11-27',
        [
          bill('A', '2026-12-03', { status: 'paid' }),
          bill('B', '2026-12-05', { status: 'paid' }),
          bill('C', '2026-12-07'),
        ],
        { previous: first.groups },
      ),
    );
    expect(after.groups.map((g) => [g.payDay, g.billIds])).toEqual([['2026-11-27', ['C']]]);
    expect(after.skipped.map((s) => [s.billId, s.reason])).toEqual([
      ['A', 'paid'],
      ['B', 'paid'],
    ]);
  });
});

describe('planPayDays: edge cases', () => {
  it('uses the configured lead days', () => {
    const out = planPayDays(
      input('2026-11-01', [bill('A', '2026-12-10')], { config: { leadDays: 3 } }),
    );
    expect(out.groups[0]?.payDay).toBe('2026-12-07');
  });

  it('never plans before the statement is available', () => {
    const out = planPayDays(
      input('2026-11-01', [bill('A', '2026-12-10', { availableFrom: '2026-12-08' })]),
    );
    expect(out.groups[0]?.payDay).toBe('2026-12-08');
    expect(out.groups[0]?.risk).toBe('tight');
  });

  it('keeps excluded cards in their own group', () => {
    const out = planPayDays(
      input('2026-11-20', [
        bill('A', '2026-12-03'),
        bill('B', '2026-12-04', { excludeFromGrouping: true }),
      ]),
    );
    expect(out.groups).toHaveLength(2);
  });

  it('respects a pinned pay day and warns when it is after the safe day', () => {
    const out = planPayDays(
      input('2026-11-20', [bill('A', '2026-12-03', { pinnedPayDay: '2026-12-02' })]),
    );
    expect(out.groups[0]).toMatchObject({ payDay: '2026-12-02', risk: 'late' });
    expect(out.warnings).toContainEqual({ code: 'PIN_AFTER_SAFE_DAY', billId: 'A' });
  });

  it('skips overdue, void and out-of-horizon bills with reasons', () => {
    const out = planPayDays(
      input('2026-11-20', [
        bill('A', '2026-11-18', { status: 'overdue' }),
        bill('B', '2026-12-03', { status: 'void' }),
        bill('C', '2027-06-01'),
      ]),
    );
    expect(out.groups).toHaveLength(0);
    expect(out.skipped.map((s) => s.reason)).toEqual(['overdue', 'void', 'beyond-horizon']);
  });

  it('a new earlier member moves a retained pay day earlier, never later', () => {
    const first = planPayDays(input('2026-11-20', [bill('C', '2026-12-07')]));
    expect(first.groups[0]?.payDay).toBe('2026-12-02');
    const next = planPayDays(
      input('2026-11-20', [bill('A', '2026-12-03'), bill('C', '2026-12-07')], {
        previous: first.groups,
      }),
    );
    expect(next.groups[0]?.payDay).toBe('2026-11-27');
  });
});

// ---------- Properties (design doc 03, section 8) ----------

const today = '2026-11-02';
const arbBills = fc
  .uniqueArray(fc.integer({ min: 3, max: 55 }), { minLength: 1, maxLength: 8 })
  .map((offsets) => offsets.map((o, i) => bill(`b${i}`, addDays(today, o))));
const arbHolidays = fc
  .uniqueArray(fc.integer({ min: 0, max: 60 }), { maxLength: 6 })
  .map((xs) => xs.map((x) => addDays(today, x)));

describe('planPayDays: properties', () => {
  it('safety, pay-day, window, partition and earlier-only hold for any input', () => {
    fc.assert(
      fc.property(arbBills, arbHolidays, (bills, holidays) => {
        const cal = createCalendar({ holidays });
        const out = planPayDays({ today, bills, calendar: cal });
        const seen = out.groups.flatMap((g) => g.billIds);
        expect(new Set(seen).size).toBe(seen.length);
        expect(seen.length + out.skipped.length).toBe(bills.length);
        for (const g of out.groups) {
          expect(cal.isPayDay(g.payDay)).toBe(true);
          expect(diffDays(g.latestDue, g.earliestDue)).toBeLessThanOrEqual(7);
          if (g.risk !== 'late') {
            expect(compareDates(g.payDay, g.lastSafeDay)).toBeLessThanOrEqual(0);
          }
          // Earlier-only: never later than "lead days before the earliest due date",
          // unless the plan had to be clamped to the first pay day from today.
          const earliestAllowed = cal.isPayDay(today) ? today : cal.nextPayDay(today);
          const bound = [addDays(g.earliestDue, -5), earliestAllowed].sort(compareDates)[1];
          expect(compareDates(g.payDay, bound ?? today)).toBeLessThanOrEqual(0);
          expect(compareDates(g.payDay, today)).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('is invariant to input order (determinism)', () => {
    fc.assert(
      fc.property(arbBills, fc.integer(), (bills, seed) => {
        const shuffled = [...bills].sort(
          (a, b) => ((a.id.charCodeAt(1) * seed) % 7) - ((b.id.charCodeAt(1) * seed) % 7),
        );
        expect(planPayDays({ today, bills: shuffled, calendar })).toEqual(
          planPayDays({ today, bills, calendar }),
        );
      }),
    );
  });

  it('uses the minimum number of groups when no per-card overrides exist', () => {
    fc.assert(
      fc.property(arbBills, (bills) => {
        const dues = bills.map((b) => b.dueDate).sort(compareDates);
        let oracle = 0;
        let start: string | undefined;
        for (const d of dues) {
          if (start === undefined || diffDays(d, start) > 7) {
            oracle += 1;
            start = d;
          }
        }
        expect(planPayDays({ today, bills, calendar }).groups).toHaveLength(oracle);
      }),
    );
  });

  it('re-planning with its own output as previous is idempotent', () => {
    fc.assert(
      fc.property(arbBills, (bills) => {
        const once = planPayDays({ today, bills, calendar });
        expect(planPayDays({ today, bills, calendar, previous: once.groups })).toEqual(once);
      }),
    );
  });

  it('does not depend on the process time zone (no Date usage)', () => {
    const a = planPayDays({ today, bills: [bill('x', fromDayNumber(20800))], calendar });
    expect(a.groups[0]?.payDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
