/**
 * The reminder plan for this device: one notice per date, built from open bills and the
 * user's settings. Pure, so the same plan feeds the banner, notifications and the .ics file.
 */
import {
  buildNotices,
  createCalendar,
  planPayDays,
  planReminders,
  type CardLabel,
  type CivilDate,
  type Notice,
  type PayDayEvent,
} from '@creditq/core';
import type { Bill, Card, ReminderSettings } from '@creditq/vault';

export interface PlanInput {
  today: CivilDate;
  cards: readonly Card[];
  bills: readonly Bill[];
  settings: ReminderSettings;
}

/** Pay days only, each with the cards to pay and their due dates, for the calendar file. */
export const buildPayDayEvents = ({ today, cards, bills, settings }: PlanInput): PayDayEvent[] => {
  const inputs = bills.map((b) => ({
    id: b.id,
    cardId: b.cardId,
    dueDate: b.dueDate,
    status: b.status,
    ...(b.statementDate ? { availableFrom: b.statementDate } : {}),
  }));
  const { groups } = planPayDays({
    today,
    calendar: createCalendar(),
    bills: inputs,
    config: { leadDays: settings.leadDays },
  });
  const byCard = new Map(cards.map((c) => [c.id, c]));
  const byBill = new Map(bills.map((b) => [b.id, b]));
  return groups
    .filter((g) => g.payDay >= today)
    .map((g) => ({
      date: g.payDay,
      cards: g.billIds.flatMap((id) => {
        const bill = byBill.get(id);
        const card = bill && byCard.get(bill.cardId);
        return bill && bill.status === 'open' && card
          ? [{ name: card.name, last4: card.last4, dueDate: bill.dueDate }]
          : [];
      }),
    }))
    .filter((e) => e.cards.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const buildReminderPlan = ({ today, cards, bills, settings }: PlanInput): Notice[] => {
  const calendar = createCalendar();
  const inputs = bills.map((b) => ({
    id: b.id,
    cardId: b.cardId,
    dueDate: b.dueDate,
    status: b.status,
    ...(b.statementDate ? { availableFrom: b.statementDate } : {}),
  }));
  const { groups } = planPayDays({
    today,
    calendar,
    bills: inputs,
    config: { leadDays: settings.leadDays },
  });
  const events = planReminders({ today, groups, bills: inputs });
  const byCard = new Map(cards.map((c) => [c.id, c]));
  const labels = new Map<string, CardLabel>();
  bills.forEach((b) => {
    const c = byCard.get(b.cardId);
    if (c) labels.set(b.id, { name: c.name, last4: c.last4 });
  });
  return buildNotices(events, {
    dueDates: new Map(bills.map((b) => [b.id, b.dueDate])),
    labels,
    contentLevel: settings.contentLevel,
    time: settings.reminderTime,
  });
};

/** What the service worker may show while the app is closed. Never card names or amounts. */
export interface OutboxRow {
  itemId: string;
  date: CivilDate;
  fireAt: number;
  title: string;
  body: string;
  tag: string;
  shownAt: number | null;
}

// The outbox is readable without the vault key, so it always carries the minimal text:
// the body lists due dates only, even if the user allowed card names in the app.
const minimalBody = (n: Notice) => n.body.replace(/^.*?(?=Due )/, '');

export const mergeOutbox = (
  existing: readonly OutboxRow[],
  plan: readonly Notice[],
): OutboxRow[] => {
  const shown = new Map(existing.map((r) => [r.itemId, r.shownAt]));
  return plan.map((n) => ({
    itemId: n.itemId,
    date: n.date,
    fireAt: n.fireAt,
    title: n.title,
    body: minimalBody(n),
    tag: n.tag,
    shownAt: shown.get(n.itemId) ?? null,
  }));
};

/**
 * Notices to show now: today's, once their time has come, not shown before.
 * Older missed days are not replayed as a burst; the in-app banner covers them.
 */
export const dueToShow = (
  rows: readonly OutboxRow[],
  nowMs: number,
  today: CivilDate,
): OutboxRow[] => rows.filter((r) => r.date === today && r.fireAt <= nowMs && r.shownAt === null);
