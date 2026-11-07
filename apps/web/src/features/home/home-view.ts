/**
 * Home screen view model: turns cards plus "which are paid" into exactly what the
 * screen shows. Pure, so it is unit-tested without a browser. No amounts, by design.
 */
import {
  createCalendar,
  detectIssuer,
  formatCountdown,
  formatShortDate,
  planPayDays,
  type BillInput,
  type BusinessCalendar,
  type CivilDate,
  type Issuer,
} from '@creditq/core';
import type { TileTone } from '@creditq/vault';

export type { TileTone };

export interface CardRecord {
  id: string;
  name: string;
  last4: string;
  dueDate: CivilDate;
  tone: TileTone;
  /** When the shown bill was generated; no pay day is planned before it. */
  statementDate?: CivilDate;
  /** For a paid card: when its next bill is generated. */
  nextStatementDate?: CivilDate;
}

export interface HomeTile {
  cardId: string;
  name: string;
  last4: string;
  tone: TileTone;
  issuer: Issuer;
  dueLabel: string;
  pill: string;
  isFocus: boolean;
}

export interface DeckCard {
  cardId: string;
  name: string;
  last4: string;
  tone: TileTone;
  issuer: Issuer;
  label: string;
}

export interface CalendarView {
  month: string;
  title: string;
  today: CivilDate;
  payDays: CivilDate[];
  dueDates: CivilDate[];
}

export interface HomeView {
  isEmpty: boolean;
  dueSoonCount: number;
  banner: string;
  tiles: HomeTile[];
  deck: DeckCard[];
  calendar: CalendarView;
}

export interface HomeInput {
  today: CivilDate;
  cards: readonly CardRecord[];
  paidCardIds: readonly string[];
  calendar?: BusinessCalendar;
  reminderTime?: string;
  leadDays?: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const calendarFor = (
  month: string,
  today: CivilDate,
  payDays: CivilDate[],
  dueDates: CivilDate[],
): CalendarView => ({
  month,
  title: `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`,
  today,
  payDays: payDays.filter((d) => d.startsWith(month)),
  dueDates: dueDates.filter((d) => d.startsWith(month)),
});

export const buildHomeView = (input: HomeInput): HomeView => {
  const { today, cards } = input;
  const calendar = input.calendar ?? createCalendar();
  const reminderTime = input.reminderTime ?? '9:00 am';
  const paid = new Set(input.paidCardIds);
  if (cards.length === 0) {
    return {
      isEmpty: true,
      dueSoonCount: 0,
      banner: '',
      tiles: [],
      deck: [],
      calendar: calendarFor(today.slice(0, 7), today, [], []),
    };
  }

  const toBill = (c: CardRecord, status: BillInput['status']): BillInput => ({
    id: c.id,
    cardId: c.id,
    dueDate: c.dueDate,
    status,
    ...(c.statementDate ? { availableFrom: c.statementDate } : {}),
  });
  // Until stored groups exist, the plan with every bill unpaid stands in for "previous",
  // so paying one card never pushes the others' pay day later.
  const config = { leadDays: input.leadDays ?? 5 };
  const previous = planPayDays({
    today,
    calendar,
    config,
    bills: cards.map((c) => toBill(c, 'open')),
  });
  const plan = planPayDays({
    today,
    calendar,
    config,
    previous: previous.groups,
    bills: cards.map((c) => toBill(c, paid.has(c.id) ? 'paid' : 'open')),
  });
  const groupOf = new Map(plan.groups.flatMap((g) => g.billIds.map((id) => [id, g] as const)));

  const byDue = [...cards].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id),
  );
  const unpaid = byDue.filter((c) => !paid.has(c.id));
  const focusGroup = plan.groups[0];

  const tiles = unpaid.map((c, i): HomeTile => {
    const group = groupOf.get(c.id);
    let pill = '';
    if (group && i === 0) pill = `Pay day ${formatCountdown(today, group.payDay)}`;
    else if (group && group === focusGroup) pill = 'Same pay day';
    else if (group) pill = `Pay day ${formatShortDate(group.payDay)}`;
    return {
      cardId: c.id,
      name: c.name,
      last4: c.last4,
      tone: c.tone,
      issuer: detectIssuer(c.name),
      dueLabel: `Due ${formatShortDate(c.dueDate)}`,
      pill: capitalise(pill),
      isFocus: i === 0,
    };
  });

  const deck = byDue
    .filter((c) => paid.has(c.id))
    .map((c): DeckCard => ({
      cardId: c.id,
      name: c.name,
      last4: c.last4,
      tone: c.tone,
      issuer: detectIssuer(c.name),
      label: c.nextStatementDate
        ? `Paid · next bill ${formatShortDate(c.nextStatementDate)}`
        : 'Paid',
    }));

  const banner = focusGroup
    ? `Reminders on. Pay day: ${formatShortDate(focusGroup.payDay)} at ${reminderTime}.`
    : 'All paid. Nothing to do until your next statement.';

  const month = (focusGroup?.payDay ?? today).slice(0, 7);
  return {
    isEmpty: false,
    dueSoonCount: unpaid.length,
    banner,
    tiles,
    deck,
    calendar: calendarFor(
      month,
      today,
      plan.groups.map((g) => g.payDay),
      unpaid.map((c) => c.dueDate),
    ),
  };
};
