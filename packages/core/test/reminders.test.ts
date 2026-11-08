import { describe, expect, it } from 'vitest';
import { createCalendar, planPayDays, planReminders, type BillInput } from '../src';

const calendar = createCalendar();
const bill = (id: string, dueDate: string, status: BillInput['status'] = 'open'): BillInput => ({
  id,
  cardId: `card-${id}`,
  dueDate,
  status,
});

describe('planReminders (design doc 03 section 3.2, example 1)', () => {
  const bills = [bill('A', '2026-12-03'), bill('B', '2026-12-05'), bill('C', '2026-12-07')];
  const { groups } = planPayDays({ today: '2026-11-20', bills, calendar });

  it('emits the pay day and each due day, with no heads-up in between', () => {
    const events = planReminders({ today: '2026-11-20', groups, bills });
    expect(
      events.map((e) => [e.date, e.items.map((i) => `${i.kind}:${i.billIds.join('+')}`)]),
    ).toEqual([
      ['2026-11-27', ['pay-day:A+B+C']],
      ['2026-12-03', ['due-today:A']],
      ['2026-12-05', ['due-today:B']],
      ['2026-12-07', ['due-today:C']],
    ]);
  });

  it('drops reminders for paid bills and dates already past', () => {
    const paidA = [
      bill('A', '2026-12-03', 'paid'),
      bill('B', '2026-12-05'),
      bill('C', '2026-12-07'),
    ];
    const events = planReminders({ today: '2026-12-02', groups, bills: paidA });
    expect(events.map((e) => e.date)).toEqual(['2026-12-05', '2026-12-07']);
    expect(events.flatMap((e) => e.items.flatMap((i) => i.billIds))).not.toContain('A');
  });

  it('never puts an amount in any reminder (privacy invariant)', () => {
    const events = planReminders({ today: '2026-11-20', groups, bills });
    expect(JSON.stringify(events)).not.toMatch(/amount|₹|paise/i);
  });
});
