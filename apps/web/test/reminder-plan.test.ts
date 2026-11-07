import { describe, expect, it } from 'vitest';
import { istInstant } from '@creditq/core';
import type { Bill, Card } from '@creditq/vault';
import {
  buildReminderPlan,
  dueToShow,
  mergeOutbox,
  type OutboxRow,
} from '../src/features/reminders/reminder-plan';

const card = (id: string, name: string, last4: string): Card => ({
  id,
  name,
  last4,
  tone: 'forest',
  dueDay: 1,
  createdAt: 0,
});
const bill = (
  id: string,
  cardId: string,
  dueDate: string,
  status: Bill['status'] = 'open',
): Bill => ({
  id,
  cardId,
  dueDate,
  status,
  createdAt: 0,
});
const cards = [card('a', 'HDFC Regalia', '4821'), card('b', 'Axis Flipkart', '9033')];
const bills = [bill('a1', 'a', '2026-12-03'), bill('b1', 'b', '2026-12-05')];
const settings = { leadDays: 5, reminderTime: '09:00', contentLevel: 'minimal' as const };

describe('buildReminderPlan', () => {
  it('turns open bills into dated notices with no names by default', () => {
    const plan = buildReminderPlan({ today: '2026-11-20', cards, bills, settings });
    expect(plan.map((n) => [n.date, n.title])).toEqual([
      ['2026-11-27', 'Pay day: 2 card bills'],
      ['2026-12-01', '1 bill due in 2 days'],
      ['2026-12-03', '1 bill due today, 1 bill due in 2 days'],
      ['2026-12-05', '1 bill due today'],
    ]);
    expect(JSON.stringify(plan)).not.toContain('HDFC');
  });

  it('honours lead days, time and the card-names setting', () => {
    const plan = buildReminderPlan({
      today: '2026-11-20',
      cards,
      bills,
      settings: { leadDays: 3, reminderTime: '19:00', contentLevel: 'cards' },
    });
    expect(plan[0]).toMatchObject({ date: '2026-11-30', time: '19:00' });
    expect(plan[0]?.body).toContain('HDFC Regalia ••4821');
  });

  it('ignores paid bills', () => {
    const plan = buildReminderPlan({
      today: '2026-11-20',
      cards,
      bills: [bill('a1', 'a', '2026-12-03', 'paid'), bill('b1', 'b', '2026-12-05')],
      settings,
    });
    expect(plan.flatMap((n) => n.billIds)).not.toContain('a1');
  });
});

describe('outbox (what the service worker may show while the app is closed)', () => {
  const plan = buildReminderPlan({ today: '2026-11-20', cards, bills, settings });

  it('keeps the shown state of unchanged notices and drops stale ones', () => {
    const first = mergeOutbox([], plan);
    const shown: OutboxRow[] = first.map((r, i) => (i === 0 ? { ...r, shownAt: 123 } : r));
    const next = mergeOutbox(shown, plan.slice(0, 2));
    expect(next).toHaveLength(2);
    expect(next[0]?.shownAt).toBe(123);
    expect(next[1]?.shownAt).toBeNull();
  });

  it('only stores the minimal text, never card names', () => {
    const named = buildReminderPlan({
      today: '2026-11-20',
      cards,
      bills,
      settings: { ...settings, contentLevel: 'cards' },
    });
    expect(JSON.stringify(mergeOutbox([], named))).not.toContain('HDFC');
  });
});

describe('dueToShow', () => {
  const rows = mergeOutbox([], buildReminderPlan({ today: '2026-11-20', cards, bills, settings }));
  const at = (date: string, time: string) => istInstant(date, time);

  it('shows a reminder once its time has come that day', () => {
    expect(dueToShow(rows, at('2026-11-27', '08:59'), '2026-11-27')).toEqual([]);
    expect(dueToShow(rows, at('2026-11-27', '09:00'), '2026-11-27').map((r) => r.date)).toEqual([
      '2026-11-27',
    ]);
  });

  it('never shows the same reminder twice', () => {
    const shown = rows.map((r) => (r.date === '2026-11-27' ? { ...r, shownAt: 1 } : r));
    expect(dueToShow(shown, at('2026-11-27', '12:00'), '2026-11-27')).toEqual([]);
  });

  it('does not replay old reminders after days away (the in-app banner covers them)', () => {
    expect(dueToShow(rows, at('2026-12-03', '10:00'), '2026-12-03').map((r) => r.date)).toEqual([
      '2026-12-03',
    ]);
  });
});
