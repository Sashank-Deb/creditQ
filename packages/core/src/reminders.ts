/**
 * Reminder dates derived from planned groups (design doc 03 section 3.2, doc 04).
 * Output carries bill ids only, never amounts: notification and calendar copy is built
 * from these ids plus card nicknames by the app.
 */
import type { BusinessCalendar } from './calendar';
import { addDays, compareDates, type CivilDate } from './civil-date';
import type { BillInput, PlannedGroup } from './grouping';

export type ReminderKind = 'pay-day' | 'follow-up' | 'due-today';

export interface ReminderItem {
  kind: ReminderKind;
  billIds: string[];
  groupKey: string;
}

export interface ReminderEvent {
  date: CivilDate;
  items: ReminderItem[];
}

export interface ReminderInput {
  today: CivilDate;
  groups: readonly PlannedGroup[];
  bills: readonly BillInput[];
  calendar: BusinessCalendar;
  /** Days before the due date for the follow-up nudge (default 2). */
  followUpDays?: number;
}

const KIND_ORDER: Record<ReminderKind, number> = { 'pay-day': 0, 'due-today': 1, 'follow-up': 2 };

export const planReminders = (input: ReminderInput): ReminderEvent[] => {
  const { today, calendar: cal } = input;
  const followUpDays = input.followUpDays ?? 2;
  const unpaid = new Map(
    input.bills
      .filter((b) => b.status === 'open' || b.status === 'projected')
      .map((b) => [b.id, b]),
  );
  const byDate = new Map<CivilDate, ReminderItem[]>();
  const add = (date: CivilDate, item: ReminderItem): void => {
    if (compareDates(date, today) < 0) return;
    byDate.set(date, [...(byDate.get(date) ?? []), item]);
  };

  for (const g of input.groups) {
    const open = g.billIds.filter((id) => unpaid.has(id));
    if (open.length > 0) {
      add(g.payDay, { kind: 'pay-day', billIds: open, groupKey: g.key });
      for (const id of open) {
        const bill = unpaid.get(id) as BillInput;
        const followUp = cal.rollEarlier(addDays(bill.dueDate, -followUpDays));
        if (compareDates(followUp, g.payDay) > 0) {
          add(followUp, { kind: 'follow-up', billIds: [id], groupKey: g.key });
        }
        // The due day is the real due date, even on a weekend: "due today, pay now".
        add(bill.dueDate, { kind: 'due-today', billIds: [id], groupKey: g.key });
      }
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => compareDates(a, b))
    .map(([date, items]) => ({
      date,
      items: items.sort(
        (a, b) =>
          KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
          compareDates(a.billIds[0] ?? '', b.billIds[0] ?? ''),
      ),
    }));
};
