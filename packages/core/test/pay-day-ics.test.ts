import { describe, expect, it } from 'vitest';
import { toPayDayIcs, type PayDayEvent } from '../src';

const events: PayDayEvent[] = [
  {
    date: '2026-11-20',
    cards: [
      { name: 'Regalia', last4: '4821', dueDate: '2026-11-24' },
      { name: 'Amazon Pay', last4: '9033', dueDate: '2026-11-27' },
    ],
  },
  { date: '2026-12-18', cards: [{ name: 'Regalia', last4: '4821', dueDate: '2026-12-24' }] },
];

const unfold = (ics: string) => ics.replace(/\r\n /g, '');
const ics = unfold(toPayDayIcs(events, { dtstamp: 1_772_500_000_000, time: '09:00' }));

describe('pay-day calendar file', () => {
  it('has one full-day event per pay day, and nothing for due dates', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261120');
    expect(ics).toContain('DTEND;VALUE=DATE:20261121');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261218');
    expect(ics).not.toContain('DTSTART:');
    expect(ics).not.toContain('due today');
  });

  it('lists every card with its due date in the description', () => {
    expect(ics).toContain('SUMMARY:Pay day: 2 credit card bills');
    expect(ics).toContain('SUMMARY:Pay day: 1 credit card bill');
    expect(ics).toContain('Regalia ••4821');
    expect(ics).toContain('due Tue\\, 24 Nov');
    expect(ics).toContain('Amazon Pay ••9033');
    expect(ics).toContain('due Fri\\, 27 Nov');
  });

  it('never contains an amount', () => {
    expect(ics).not.toMatch(/₹|Rs\.?\s?\d/);
  });

  it('rings at the reminder time on the day, and does not block the calendar', () => {
    expect(ics).toContain('TRIGGER:PT9H');
    expect(ics).toContain('TRANSP:TRANSPARENT');
  });

  it('keeps UIDs stable between exports', () => {
    const again = unfold(toPayDayIcs(events, { dtstamp: 1_900_000_000_000, time: '09:00' }));
    const uids = (s: string) => s.match(/UID:.*/g);
    expect(uids(again)).toEqual(uids(ics));
  });

  it('sorts cards by due date inside an event', () => {
    const swapped = unfold(
      toPayDayIcs([{ date: '2026-11-20', cards: [...(events[0]?.cards ?? [])].reverse() }], {
        dtstamp: 1,
        time: '09:00',
      }),
    );
    expect(swapped.indexOf('Regalia')).toBeLessThan(swapped.indexOf('Amazon Pay'));
  });
});
