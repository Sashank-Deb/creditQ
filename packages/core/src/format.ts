/**
 * Deterministic en-IN content formatting (no Intl, so output never varies by device locale).
 * Follows the design's content rules: "Tue, 3 Mar", "₹1,23,456", sentence case.
 */
import { dayOfMonth, dayOfWeek, diffDays, type CivilDate } from './civil-date';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatShortDate = (d: CivilDate): string => {
  const month = MONTHS[Number(d.slice(5, 7)) - 1];
  return `${WEEKDAYS[dayOfWeek(d)]}, ${dayOfMonth(d)} ${month}`;
};

/** Relative phrase for `target` as seen from `today`: "today", "tomorrow", "in 3 days". */
export const formatCountdown = (today: CivilDate, target: CivilDate): string => {
  const n = diffDays(target, today);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
};

/** Indian grouping: last three digits, then pairs (1,23,45,678). */
const groupIndian = (digits: string): string => {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}`;
};

/** Money is stored as integer paise; whole rupees drop the decimals. */
export const formatRupees = (paise: number): string => {
  const rupees = Math.trunc(paise / 100);
  const rest = Math.abs(paise % 100);
  const whole = groupIndian(String(Math.abs(rupees)));
  const sign = paise < 0 ? '-' : '';
  return rest === 0 ? `${sign}₹${whole}` : `${sign}₹${whole}.${String(rest).padStart(2, '0')}`;
};

/** 'HH:MM' (24 h) to "9:00 am" / "7:30 pm". */
export const formatClock = (hhmm: string): string => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`;
};
