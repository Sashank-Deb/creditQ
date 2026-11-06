import { addDays, dayOfMonth, dayOfWeek, type CivilDate } from './civil-date';

/**
 * - `all-off`: every Saturday is a non-business day (default; Mon-Fri banking).
 * - `rbi`: only the 2nd and 4th Saturdays are bank holidays (RBI rule).
 * Either way a Saturday is never chosen as a pay day (design doc 03, D3).
 */
export type SaturdayRule = 'all-off' | 'rbi';

export interface CalendarOptions {
  holidays?: readonly CivilDate[];
  saturdays?: SaturdayRule;
  allowWeekendPayDay?: boolean;
}

export interface BusinessCalendar {
  isBusinessDay(d: CivilDate): boolean;
  isPayDay(d: CivilDate): boolean;
  rollEarlier(d: CivilDate): CivilDate;
  prevBusinessDayOrSame(d: CivilDate): CivilDate;
  nextPayDay(d: CivilDate): CivilDate;
  subBusinessDays(d: CivilDate, n: number): CivilDate;
  /** Business days in the half-open range (from, to]. Zero when to <= from. */
  businessDaysBetween(from: CivilDate, to: CivilDate): number;
}

// Longest plausible run of non-working days (holiday chains plus weekends) is ~8.
// A hard cap turns a bad holiday list into an error instead of an infinite loop.
const MAX_SCAN = 60;

export const createCalendar = (options: CalendarOptions = {}): BusinessCalendar => {
  const holidays = new Set(options.holidays ?? []);
  const saturdays = options.saturdays ?? 'all-off';
  const allowWeekendPayDay = options.allowWeekendPayDay ?? false;

  const isWeekend = (d: CivilDate): boolean => {
    const dow = dayOfWeek(d);
    return dow === 0 || dow === 6;
  };

  const isBusinessDay = (d: CivilDate): boolean => {
    if (holidays.has(d)) return false;
    const dow = dayOfWeek(d);
    if (dow === 0) return false;
    if (dow === 6) {
      if (saturdays === 'all-off') return false;
      const nth = Math.ceil(dayOfMonth(d) / 7);
      return nth !== 2 && nth !== 4;
    }
    return true;
  };

  const isPayDay = (d: CivilDate): boolean =>
    isBusinessDay(d) && (allowWeekendPayDay || !isWeekend(d));

  const scan = (start: CivilDate, step: 1 | -1, ok: (d: CivilDate) => boolean): CivilDate => {
    let d = start;
    for (let i = 0; i < MAX_SCAN; i++) {
      if (ok(d)) return d;
      d = addDays(d, step);
    }
    throw new RangeError(`No working day within ${MAX_SCAN} days of ${start}`);
  };

  const subBusinessDays = (d: CivilDate, n: number): CivilDate => {
    let cur = d;
    for (let i = 0; i < n; i++) cur = scan(addDays(cur, -1), -1, isBusinessDay);
    return cur;
  };

  const businessDaysBetween = (from: CivilDate, to: CivilDate): number => {
    let count = 0;
    for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) {
      if (isBusinessDay(d)) count += 1;
    }
    return count;
  };

  return {
    isBusinessDay,
    isPayDay,
    rollEarlier: (d) => scan(d, -1, isPayDay),
    prevBusinessDayOrSame: (d) => scan(d, -1, isBusinessDay),
    nextPayDay: (d) => scan(addDays(d, 1), 1, isPayDay),
    subBusinessDays,
    businessDaysBetween,
  };
};
