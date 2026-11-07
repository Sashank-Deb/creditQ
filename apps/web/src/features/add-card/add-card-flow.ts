/**
 * Add-card flow state: step 1 "Which card is it?", step 2 "When is it due?",
 * step 3 "When was this bill generated?" (the statement date that starts each monthly cycle).
 * One question per step, inline errors, no amounts anywhere. Pure, so it is unit-tested.
 */
import {
  createCalendar,
  validateBank,
  formatShortDate,
  planPayDays,
  validateCardDetails,
  validateDueDate,
  validateStatementDate,
  type CivilDate,
} from '@creditq/core';
import type { TilePattern, TileTone } from '@creditq/vault';

type Field = 'bank' | 'name' | 'last4' | 'dueDate' | 'statementDate';

export interface AddCardState {
  today: CivilDate;
  step: 1 | 2 | 3 | 'saving';
  /** The bank, chosen separately from the card name. */
  bank: string;
  /** True when the user picked "Other" and types their own bank. */
  otherBank: boolean;
  name: string;
  last4: string;
  dueDate: string;
  statementDate: string;
  /** null = automatic: the next colour in the rotation. */
  tone: TileTone | null;
  pattern: TilePattern;
  errors: Partial<Record<Field, string>>;
}

export type AddCardAction =
  | { type: 'set'; field: Field; value: string }
  | { type: 'pickBank'; bank: string }
  | { type: 'setTone'; tone: TileTone | null }
  | { type: 'setPattern'; pattern: TilePattern }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'failed'; message: string };

export const initialAddCard = (today: CivilDate): AddCardState => ({
  today,
  step: 1,
  bank: '',
  otherBank: false,
  name: '',
  last4: '',
  dueDate: '',
  statementDate: '',
  tone: null,
  pattern: 'diamonds',
  errors: {},
});

const withoutError = (errors: AddCardState['errors'], field: Field) => {
  const { [field]: dropped, ...rest } = errors;
  return rest;
};

export const addCardReducer = (state: AddCardState, action: AddCardAction): AddCardState => {
  switch (action.type) {
    case 'set': {
      const value =
        action.field === 'last4' ? action.value.replace(/\D/g, '').slice(0, 4) : action.value;
      return { ...state, [action.field]: value, errors: withoutError(state.errors, action.field) };
    }
    case 'pickBank':
      return action.bank === 'Other'
        ? { ...state, otherBank: true, bank: '', errors: withoutError(state.errors, 'bank') }
        : {
            ...state,
            otherBank: false,
            bank: action.bank,
            errors: withoutError(state.errors, 'bank'),
          };
    case 'setTone':
      return { ...state, tone: action.tone };
    case 'setPattern':
      return { ...state, pattern: action.pattern };
    case 'back':
      if (state.step === 2) return { ...state, step: 1, errors: {} };
      if (state.step === 3) return { ...state, step: 2, errors: {} };
      return state;
    case 'failed':
      return { ...state, step: 3, errors: { statementDate: action.message } };
    case 'next': {
      if (state.step === 1) {
        const details = validateCardDetails({ name: state.name, last4: state.last4 });
        const bank = validateBank(state.bank);
        if (details.ok && bank.ok) {
          return { ...state, ...details.value, bank: bank.value, step: 2, errors: {} };
        }
        return {
          ...state,
          errors: {
            ...(bank.ok ? {} : bank.errors),
            ...(details.ok ? {} : details.errors),
          },
        };
      }
      if (state.step === 2) {
        const r = validateDueDate(state.dueDate, state.today);
        return r.ok ? { ...state, step: 3, errors: {} } : { ...state, errors: r.errors };
      }
      if (state.step === 3) {
        const r = validateStatementDate(state.statementDate, state.dueDate);
        return r.ok ? { ...state, step: 'saving', errors: {} } : { ...state, errors: r.errors };
      }
      return state;
    }
    default:
      return state;
  }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const joinAnd = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

/** "8, 10 and 12 Mar" when one month, "28 Feb and 2 Mar" otherwise. */
const dueList = (dates: CivilDate[]): string => {
  const month = (d: CivilDate) => MONTHS[Number(d.slice(5, 7)) - 1];
  const day = (d: CivilDate) => String(Number(d.slice(8, 10)));
  const sameMonth = dates.every((d) => d.slice(0, 7) === dates[0]?.slice(0, 7));
  return sameMonth
    ? `${joinAnd(dates.map(day))} ${month(dates[0] ?? '')}`
    : joinAnd(dates.map((d) => `${day(d)} ${month(d)}`));
};

export interface ReminderPreview {
  headline: string;
  detail: string;
  notification: string;
}

/** What the user will get, shown on the "card is set" screen. Never includes amounts. */
export const reminderPreview = (
  today: CivilDate,
  dueDates: CivilDate[],
  reminderTime: string,
  leadDays = 5,
): ReminderPreview => {
  const plan = planPayDays({
    today,
    calendar: createCalendar(),
    config: { leadDays },
    bills: dueDates.map((d, i) => ({ id: `b${i}`, cardId: `c${i}`, dueDate: d, status: 'open' })),
  });
  const group = plan.groups[0];
  if (!group) {
    return { headline: 'No bills due soon', detail: '', notification: '' };
  }
  const groupDates = [...dueDates].filter((_, i) => group.billIds.includes(`b${i}`)).sort();
  const count = groupDates.length;
  const bills = count === 1 ? '1 card bill' : `${count} card bills`;
  const detail =
    count === 1
      ? `${leadDays} days before the due date at ${reminderTime}. One reminder, then a nudge 2 days before and on the due day if unpaid.`
      : `${leadDays} days before your earliest due date. One reminder for all ${count} cards, then a nudge 2 days before and on the due day if unpaid.`;
  return {
    headline: `Pay day: ${formatShortDate(group.payDay)}`,
    detail,
    notification: `Pay day: ${bills}. Due ${dueList(groupDates)}. Tap to open.`,
  };
};
