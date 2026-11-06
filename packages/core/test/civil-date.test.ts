import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  addDays,
  compareDates,
  dayOfWeek,
  diffDays,
  fromDayNumber,
  isCivilDate,
  maxDate,
  minDate,
  toDayNumber,
} from '../src';

describe('civil dates', () => {
  it('validates the YYYY-MM-DD shape and real calendar days', () => {
    expect(isCivilDate('2026-12-01')).toBe(true);
    expect(isCivilDate('2028-02-29')).toBe(true);
    expect(isCivilDate('2027-02-29')).toBe(false);
    expect(isCivilDate('2026-13-01')).toBe(false);
    expect(isCivilDate('2026-1-01')).toBe(false);
    expect(isCivilDate('not a date')).toBe(false);
  });

  it('knows weekdays (0 = Sunday)', () => {
    expect(dayOfWeek('2026-12-01')).toBe(2); // Tuesday, the design-doc anchor
    expect(dayOfWeek('2026-11-27')).toBe(5); // Friday
    expect(dayOfWeek('1970-01-01')).toBe(4); // Thursday
    expect(dayOfWeek('2000-01-01')).toBe(6); // Saturday
  });

  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-12-03', -5)).toBe('2026-11-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('diffs and compares', () => {
    expect(diffDays('2026-12-07', '2026-12-03')).toBe(4);
    expect(compareDates('2026-12-03', '2026-12-07')).toBeLessThan(0);
    expect(minDate('2026-12-03', '2026-11-30')).toBe('2026-11-30');
    expect(maxDate('2026-12-03', '2026-11-30')).toBe('2026-12-03');
  });

  it('round-trips day numbers (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30000, max: 60000 }), (n) => {
        const d = fromDayNumber(n);
        expect(isCivilDate(d)).toBe(true);
        expect(toDayNumber(d)).toBe(n);
        expect(diffDays(addDays(d, 37), d)).toBe(37);
      }),
    );
  });
});
