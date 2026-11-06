import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { addDays, compareDates, createCalendar, fromDayNumber, toDayNumber } from '../src';

const monFri = createCalendar();
const withNewYear = createCalendar({ holidays: ['2027-01-01'] });
const rbi = createCalendar({ saturdays: 'rbi' });

describe('business calendar', () => {
  it('treats Mon-Fri as business days by default', () => {
    expect(monFri.isBusinessDay('2026-11-27')).toBe(true); // Fri
    expect(monFri.isBusinessDay('2026-11-28')).toBe(false); // Sat
    expect(monFri.isBusinessDay('2026-11-29')).toBe(false); // Sun
  });

  it('honours holidays', () => {
    expect(withNewYear.isBusinessDay('2027-01-01')).toBe(false);
    expect(withNewYear.isPayDay('2027-01-01')).toBe(false);
  });

  it('supports RBI Saturdays for business days but never pays on a Saturday', () => {
    // Dec 2026: Saturdays are 5 (1st), 12 (2nd), 19 (3rd), 26 (4th).
    expect(rbi.isBusinessDay('2026-12-05')).toBe(true);
    expect(rbi.isBusinessDay('2026-12-12')).toBe(false);
    expect(rbi.isBusinessDay('2026-12-19')).toBe(true);
    expect(rbi.isBusinessDay('2026-12-26')).toBe(false);
    expect(rbi.isPayDay('2026-12-05')).toBe(false);
  });

  it('rolls earlier over weekends and holidays', () => {
    expect(monFri.rollEarlier('2026-11-28')).toBe('2026-11-27');
    expect(withNewYear.rollEarlier('2027-01-03')).toBe('2026-12-31');
    expect(monFri.rollEarlier('2026-12-02')).toBe('2026-12-02');
  });

  it('subtracts business days and finds the next pay day', () => {
    expect(monFri.subBusinessDays('2026-12-02', 1)).toBe('2026-12-01');
    expect(monFri.subBusinessDays('2026-12-04', 1)).toBe('2026-12-03');
    expect(monFri.subBusinessDays('2026-11-30', 1)).toBe('2026-11-27');
    expect(monFri.prevBusinessDayOrSame('2026-12-06')).toBe('2026-12-04');
    expect(monFri.nextPayDay('2026-11-27')).toBe('2026-11-30');
  });

  it('counts business days in (from, to]', () => {
    expect(monFri.businessDaysBetween('2026-11-27', '2026-12-01')).toBe(2);
    expect(monFri.businessDaysBetween('2026-11-30', '2026-12-01')).toBe(1);
    expect(monFri.businessDaysBetween('2026-12-01', '2026-11-30')).toBe(0);
  });

  it('rollEarlier is never later, lands on a pay day and is idempotent (property)', () => {
    const holidays = fc.uniqueArray(fc.integer({ min: 20400, max: 20500 }), { maxLength: 12 });
    fc.assert(
      fc.property(holidays, fc.integer({ min: 20410, max: 20490 }), (hs, n) => {
        const cal = createCalendar({ holidays: hs.map(fromDayNumber) });
        const d = fromDayNumber(n);
        const r = cal.rollEarlier(d);
        expect(compareDates(r, d)).toBeLessThanOrEqual(0);
        expect(cal.isPayDay(r)).toBe(true);
        expect(cal.rollEarlier(r)).toBe(r);
        expect(toDayNumber(r)).toBeGreaterThan(n - 20);
      }),
    );
  });

  it('nextPayDay is strictly later and a pay day (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 20000, max: 21000 }), (n) => {
        const d = fromDayNumber(n);
        const next = monFri.nextPayDay(d);
        expect(compareDates(next, d)).toBeGreaterThan(0);
        expect(monFri.isPayDay(next)).toBe(true);
        expect(compareDates(next, addDays(d, 4))).toBeLessThanOrEqual(0);
      }),
    );
  });
});
