/**
 * Home screen view model: turns cards plus "which are paid" into exactly what the
 * screen shows. Pure, so it is unit-tested without a browser. No amounts, by design.
 */
import {
  addDays,
  compareDates,
  createCalendar,
  detectIssuer,
  endOfWeek,
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
  /** Pay day mark, only on the last card of its pay day group; empty on the others. */
  pill: string;
  /** Cards that share a pay day share a key. */
  groupKey: string;
  /** Every card listed individually is actionable: it has its own payment button. */
  isFocus: boolean;
}

export type DeckKind = 'recent' | 'paid' | 'generated';

/** A card in one of the three decks: only a strip shows until it is brought to the front. */
export interface DeckCard {
  cardId: string;
  name: string;
  last4: string;
  tone: TileTone;
  pattern: TilePattern;
  issuer: Issuer;
  kind: DeckKind;
  /** The headline when the card is open, e.g. "Paid" or "Pay day Tue, 3 Mar". */
  status: string;
  /** A second line, e.g. "Due Sun, 8 Mar". */
  note: string;
}

export interface HomeDecks {
  /** Added, and the bill is not generated yet. */
  recent: DeckCard[];
  /** Paid, waiting for the next bill. */
  paid: DeckCard[];
  /** The bill is generated, but the pay day is after this week. */
  generated: DeckCard[];
}

export interface CalendarView {
  month: string;
  title: string;
  today: CivilDate;
  /** Only today and pay days are marked; due dates are not. */
  payDays: CivilDate[];
}

export interface TimelineItem {
  kind: 'today' | 'pay-day' | 'missed';
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
  decks: HomeDecks;
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

const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const calendarFor = (month: string, today: CivilDate, payDays: CivilDate[]): CalendarView => ({
  month,
  title: `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`,
  today,
  payDays: payDays.filter((d) => d.startsWith(month)),
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
      decks: { recent: [], paid: [], generated: [] },
      calendar: calendarFor(today.slice(0, 7), today, []),
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

  // Which cards are actionable this week? The calendar week runs Monday to Sunday. A card is
  // listed on its own when its bill exists and its pay day is on or before this Sunday; a
  // missed pay day is already pulled forward to today, so it stays listed and payable.
  const weekEnd = endOfWeek(today);
  const isPending = (c: CardRecord) =>
    c.statementDate !== undefined && compareDates(c.statementDate, today) > 0;
  const payDayOf = (c: CardRecord) => groupOf.get(c.id)?.payDay;
  const inThisWeek = (c: CardRecord) => {
    const day = payDayOf(c);
    return day !== undefined && compareDates(day, weekEnd) <= 0;
  };
  const missedIds = new Set(missedGroups.flatMap((g) => g.billIds));
  // A missed pay day is always actionable, even if the catch-up day is next Monday.
  const isIndividual = (c: CardRecord) => !isPending(c) && (inThisWeek(c) || missedIds.has(c.id));
  const individual = unpaid.filter(isIndividual);

  // Cards sharing a pay day sit together, soonest pay day first, so one mark can close the group.
  const ordered = [...individual].sort(
    (x, y) =>
      compareDates(payDayOf(x) ?? x.dueDate, payDayOf(y) ?? y.dueDate) ||
      compareDates(x.dueDate, y.dueDate),
  );
  const keyOf = (c: CardRecord) => groupOf.get(c.id)?.key ?? c.id;
  const lastOfGroup = new Map(ordered.map((c, i) => [keyOf(c), i]));
  const tiles = ordered.map((c, i): HomeTile => {
    const group = groupOf.get(c.id);
    const pill =
      group && lastOfGroup.get(keyOf(c)) === i
        ? capitalise(`Pay day ${formatCountdown(today, group.payDay)}`)
        : '';
    return {
      cardId: c.id,
      name: c.name,
      last4: c.last4,
      tone: c.tone,
      pattern: c.pattern ?? 'diamonds',
      issuer: detectIssuer(c.bank ?? c.name),
      dueLabel: `Due ${formatShortDate(c.dueDate)}`,
      pill,
      groupKey: keyOf(c),
      isFocus: true,
    };
  });

  const deckCard = (c: CardRecord, kind: DeckKind, status: string, note: string): DeckCard => ({
    cardId: c.id,
    name: c.name,
    last4: c.last4,
    tone: c.tone,
    pattern: c.pattern ?? 'diamonds',
    issuer: detectIssuer(c.bank ?? c.name),
    kind,
    status,
    note,
  });
  const payDayLabel = (c: CardRecord) => {
    const day = payDayOf(c);
    return day ? `Pay day ${formatShortDate(day)}` : '';
  };
  const decks: HomeDecks = {
    recent: unpaid
      .filter(isPending)
      .map((c) =>
        deckCard(
          c,
          'recent',
          `Bill generates ${formatShortDate(c.statementDate ?? c.dueDate)}`,
          [payDayLabel(c), `Due ${formatShortDate(c.dueDate)}`].filter(Boolean).join(' · '),
        ),
      ),
    paid: byDue
      .filter((c) => paid.has(c.id))
      .map((c) =>
        deckCard(
          c,
          'paid',
          'Paid',
          c.nextStatementDate ? `Next bill ${formatShortDate(c.nextStatementDate)}` : '',
        ),
      ),
    generated: unpaid
      .filter((c) => !isPending(c) && !isIndividual(c))
      .map((c) => deckCard(c, 'generated', payDayLabel(c), `Due ${formatShortDate(c.dueDate)}`)),
  };

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
  // The timeline lists pay days only. Due-day reminders still exist; they are just not shown here.
  for (const event of events
    .filter((e) => e.items.some((i) => i.kind === 'pay-day'))
    .slice(0, TIMELINE_EVENTS)) {
    const count = event.items
      .filter((i) => i.kind === 'pay-day')
      .reduce((n, i) => n + i.billIds.length, 0);
    timeline.push({
      kind: 'pay-day',
      date: event.date,
      label: 'Pay day',
      detail: `${formatShortDate(event.date)} · ${plural(count)}`,
    });
  }

  const banner = focusGroup
    ? `Reminders on. Pay day: ${formatShortDate(focusGroup.payDay)} at ${reminderTime}.`
    : 'All paid. Nothing to do until your next statement.';

  const month = (focusGroup?.payDay ?? today).slice(0, 7);
  return {
    isEmpty: false,
    timeline,
    dueSoonCount: tiles.length,
    banner,
    tiles,
    decks,
    calendar: calendarFor(
      month,
      today,
      plan.groups.map((g) => g.payDay),
    ),
  };
};
