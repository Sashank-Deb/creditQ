/**
 * Civil (calendar) dates as `YYYY-MM-DD` strings, with pure integer arithmetic.
 * No `Date`, no time zones: a due date is a day in India, not an instant.
 * Day numbers count days since 1970-01-01 (Howard Hinnant's civil-from-days algorithm).
 */
export type CivilDate = string;

const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

const isLeapYear = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const daysInMonth = (y: number, m: number): number => {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
};

const parts = (d: CivilDate): [number, number, number] => {
  const match = SHAPE.exec(d);
  if (!match) throw new RangeError(`Not a civil date: ${d}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

export const isCivilDate = (value: string): boolean => {
  const match = SHAPE.exec(value);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const day = Number(match[3]);
  return m >= 1 && m <= 12 && day >= 1 && day <= daysInMonth(y, m);
};

export const toDayNumber = (d: CivilDate): number => {
  const [y0, m, day] = parts(d);
  const y = m <= 2 ? y0 - 1 : y0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
};

export const fromDayNumber = (n: number): CivilDate => {
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(day, 2)}`;
};

export const addDays = (d: CivilDate, days: number): CivilDate =>
  fromDayNumber(toDayNumber(d) + days);

/** `a - b` in days. */
export const diffDays = (a: CivilDate, b: CivilDate): number => toDayNumber(a) - toDayNumber(b);

/** 0 = Sunday ... 6 = Saturday. */
export const dayOfWeek = (d: CivilDate): number => (((toDayNumber(d) + 4) % 7) + 7) % 7;

/** Lexicographic order equals chronological order for this format. */
export const compareDates = (a: CivilDate, b: CivilDate): number => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export const minDate = (a: CivilDate, b: CivilDate): CivilDate => (a <= b ? a : b);
export const maxDate = (a: CivilDate, b: CivilDate): CivilDate => (a >= b ? a : b);

/** Day of month 1..31, used for the RBI 2nd/4th Saturday rule. */
export const dayOfMonth = (d: CivilDate): number => parts(d)[2];
