/**
 * Home screen view model: turns cards plus "which are paid" into exactly what the
 * screen shows. Pure, so it is unit-tested without a browser. No amounts, by design.
 */
import {
  addDays,
  compareDates,
  createCalendar,
  detectIssuer,
  formatCountdown,
  formatShortDate,
  planPayDays,
  planReminders,
  type BillInput,
  type BusinessCalendar,
  type CivilDate,
  type Issuer,
} from '@creditq/core';
import type { TilePattern, TileTone } from '@creditq/vault';

export type { TilePattern, TileTone };

export interface CardRecord {
  id: string;
  name: string;
  last4: string;
  dueDate: CivilDate;
  tone: TileTone;
  /** Chosen separately from the card name; older cards fall back to the name. */
  bank?: string;
  pattern?: TilePattern;
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
  pattern: TilePattern;
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
  pattern: TilePattern;
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

export interface TimelineItem {
  kind: 'today' | 'pay-day' | 'missed' | 'due';
  date: CivilDate;
  label: string;
  detail: string;
}

export interface HomeView {
  isEmpty: boolean;
  timeline: TimelineItem[];
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

const TIMELINE_EVENTS = 4;

const plural = (n: number) => `${n} ${n === 1 ? 'bill' : 'bills'}`;

// A day with a due date shows "Due"; otherwise it is the pay day.
const PRIORITY = [
  { item: 'due-today', kind: 'due', label: 'Due' },
  { item: 'pay-day', kind: 'pay-day', label: 'Pay day' },
] as const;

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
      timeline: [],
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
      pattern: c.pattern ?? 'diamonds',
      issuer: detectIssuer(c.bank ?? c.name),
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
      pattern: c.pattern ?? 'diamonds',
      issuer: detectIssuer(c.bank ?? c.name),
      label: c.nextStatementDate
        ? `Paid · next bill ${formatShortDate(c.nextStatementDate)}`
        : 'Paid',
    }));

  // Was the pay day missed? Plan again as if from long ago, so the day is not pushed to today.
  // Any such group that still has unpaid cards had its pay day pass without being paid.
  const ideal = planPayDays({
    today: addDays(today, -60),
    calendar,
    config: { ...config, horizonDays: 240 },
    bills: unpaid.map((c) => toBill(c, 'open')),
  });
  const missedGroups = ideal.groups.filter((g) => compareDates(g.payDay, today) < 0);
  const missedCount = missedGroups.reduce((n, g) => n + g.billIds.length, 0);
  const missedDay = missedGroups[0]?.payDay;

  const events = planReminders({
    today,
    groups: plan.groups,
    bills: unpaid.map((c) => toBill(c, 'open')),
  });

  const timeline: TimelineItem[] = [
    { kind: 'today', date: today, label: 'Today', detail: formatShortDate(today) },
  ];
  if (missedDay) {
    timeline.push({
      kind: 'missed',
      date: missedDay,
      label: 'Pay day missed',
      detail: `${formatShortDate(missedDay)} · ${plural(missedCount)}`,
    });
  }
  for (const event of events.slice(0, TIMELINE_EVENTS)) {
    const top = PRIORITY.find((p) => event.items.some((i) => i.kind === p.item));
    if (top) {
      const count = event.items
        .filter((i) => i.kind === top.item)
        .reduce((n, i) => n + i.billIds.length, 0);
      timeline.push({
        kind: top.kind,
        date: event.date,
        label: top.label,
        detail: `${formatShortDate(event.date)} · ${plural(count)}`,
      });
    }
  }

  const banner = focusGroup
    ? `Reminders on. Pay day: ${formatShortDate(focusGroup.payDay)} at ${reminderTime}.`
    : 'All paid. Nothing to do until your next statement.';

  const month = (focusGroup?.payDay ?? today).slice(0, 7);
  return {
    isEmpty: false,
    timeline,
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
