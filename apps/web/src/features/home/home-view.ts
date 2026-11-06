/**
 * Home screen view model: turns cards plus "which are paid" into exactly what the
 * screen shows. Pure, so it is unit-tested without a browser. No amounts, by design.
 */
import {
  createCalendar,
  formatCountdown,
  formatShortDate,
  planPayDays,
  type BillInput,
  type BusinessCalendar,
  type CivilDate,
} from '@creditq/core';
import type { TileTone } from '@creditq/vault';

export type { TileTone };

export interface CardRecord {
  id: string;
  name: string;
  last4: string;
  holder: string;
  dueDate: CivilDate;
  tone: TileTone;
}

export interface HomeTile {
  cardId: string;
  name: string;
  last4: string;
  holder: string;
  tone: TileTone;
  dueLabel: string;
  pill: string;
  isFocus: boolean;
  isPaid: boolean;
}

export interface HomeView {
  isEmpty: boolean;
  dueSoonCount: number;
  banner: string;
  tiles: HomeTile[];
}

export interface HomeInput {
  today: CivilDate;
  cards: readonly CardRecord[];
  paidCardIds: readonly string[];
  calendar?: BusinessCalendar;
  reminderTime?: string;
}

const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const buildHomeView = (input: HomeInput): HomeView => {
  const { today, cards } = input;
  const calendar = input.calendar ?? createCalendar();
  const reminderTime = input.reminderTime ?? '9:00 am';
  const paid = new Set(input.paidCardIds);
  if (cards.length === 0) {
    return { isEmpty: true, dueSoonCount: 0, banner: '', tiles: [] };
  }

  const toBill = (c: CardRecord, status: BillInput['status']): BillInput => ({
    id: c.id,
    cardId: c.id,
    dueDate: c.dueDate,
    status,
  });
  // Until stored groups exist (vault, M1), the plan with every bill unpaid stands in
  // for "previous", so paying one card never pushes the others' pay day later.
  const previous = planPayDays({ today, calendar, bills: cards.map((c) => toBill(c, 'open')) });
  const plan = planPayDays({
    today,
    calendar,
    previous: previous.groups,
    bills: cards.map((c) => toBill(c, paid.has(c.id) ? 'paid' : 'open')),
  });
  const groupOf = new Map(plan.groups.flatMap((g) => g.billIds.map((id) => [id, g] as const)));

  const byDue = [...cards].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id),
  );
  const ordered = [...byDue.filter((c) => !paid.has(c.id)), ...byDue.filter((c) => paid.has(c.id))];
  const focusGroup = plan.groups[0];

  const tiles = ordered.map((c, i): HomeTile => {
    const group = groupOf.get(c.id);
    let pill = 'Paid';
    if (group && i === 0) pill = `Pay day ${formatCountdown(today, group.payDay)}`;
    else if (group && group === focusGroup) pill = 'Same pay day';
    else if (group) pill = `Pay day ${formatShortDate(group.payDay)}`;
    return {
      cardId: c.id,
      name: c.name,
      last4: c.last4,
      holder: c.holder,
      tone: c.tone,
      dueLabel: `Due ${formatShortDate(c.dueDate)}`,
      pill: capitalise(pill),
      isFocus: i === 0 && !paid.has(c.id),
      isPaid: paid.has(c.id),
    };
  });

  const banner = focusGroup
    ? `Reminders on. Pay day: ${formatShortDate(focusGroup.payDay)} at ${reminderTime}.`
    : 'All paid. Nothing to do until your next statement.';

  return { isEmpty: false, dueSoonCount: cards.length - paid.size, banner, tiles };
};
