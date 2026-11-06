/**
 * Add-card input rules (2-step manual flow). We store only the last 4 digits and refuse
 * anything that looks like a full card number, wherever the user typed it.
 */
import { addDays, compareDates, isCivilDate, type CivilDate } from './civil-date';

export type Result<T, K extends string> =
  { ok: true; value: T } | { ok: false; errors: Partial<Record<K, string>> };

export interface CardDetails {
  name: string;
  last4: string;
}

const MAX_NAME = 40;
/** How far ahead a due date may be: about two statement cycles. */
export const MAX_DUE_AHEAD_DAYS = 62;

// 13-19 digits, optionally separated by spaces or dashes: a card number (PAN) shape.
const PAN_LIKE = /(?:\d[ -]?){13,19}/;

export const validateCardDetails = (input: CardDetails): Result<CardDetails, keyof CardDetails> => {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const last4 = input.last4.trim();
  const errors: Partial<Record<keyof CardDetails, string>> = {};

  if (PAN_LIKE.test(name)) errors.name = 'Remove the card number from the name';
  else if (name.length === 0) errors.name = 'Enter a name for this card';
  else if (name.length > MAX_NAME) errors.name = `Keep the name under ${MAX_NAME} characters`;

  if (PAN_LIKE.test(last4) || /^\d{5,}$/.test(last4)) {
    errors.last4 = 'Only the last 4 digits. Never type your full card number.';
  } else if (!/^\d{4}$/.test(last4)) {
    errors.last4 = 'Enter the last 4 digits';
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { name, last4 } };
};

export const validateDueDate = (input: string, today: CivilDate): Result<CivilDate, 'dueDate'> => {
  const d = input.trim();
  if (d === '')
    return { ok: false, errors: { dueDate: 'Pick the due date from your latest bill' } };
  if (!isCivilDate(d)) return { ok: false, errors: { dueDate: 'Enter a real date' } };
  if (compareDates(d, today) < 0) {
    return { ok: false, errors: { dueDate: 'That date has passed. Enter your next due date.' } };
  }
  if (compareDates(d, addDays(today, MAX_DUE_AHEAD_DAYS)) > 0) {
    return { ok: false, errors: { dueDate: 'Enter the next due date, within the next 2 months' } };
  }
  return { ok: true, value: d };
};

const daysInMonth = (y: number, m: number): number => {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
};

/**
 * Same due day next month, clamped to the month's length. `preferredDay` keeps a
 * "31st" card on the 31st after passing through a short month.
 */
export const nextMonthlyDueDate = (from: CivilDate, preferredDay?: number): CivilDate => {
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7)) + 1;
  if (m === 13) {
    m = 1;
    y += 1;
  }
  const want = preferredDay ?? Number(from.slice(8, 10));
  const day = Math.min(want, daysInMonth(y, m));
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
