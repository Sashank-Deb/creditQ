import { describe, expect, it } from 'vitest';
import {
  buildNotices,
  createCalendar,
  formatUtcStamp,
  googleCalendarUrl,
  istInstant,
  planPayDays,
  planReminders,
  toIcs,
  type BillInput,
} from '../src';

const calendar = createCalendar();
const bill = (id: string, dueDate: string): BillInput => ({
  id,
  cardId: `card-${id}`,
  dueDate,
  status: 'open',
});
// Design doc 03, example 1: due 3, 5 and 7 Dec 2026 -> pay day Fri 27 Nov.
const bills = [bill('A', '2026-12-03'), bill('B', '2026-12-05'), bill('C', '2026-12-07')];
const today = '2026-11-20';
const events = planReminders({
  today,
  bills,
  groups: planPayDays({ today, bills, calendar }).groups,
});
const dueDates = new Map(bills.map((b) => [b.id, b.dueDate]));
const labels = new Map([
  ['A', { name: 'HDFC Regalia', last4: '4821' }],
  ['B', { name: 'Axis Flipkart', last4: '9033' }],
  ['C', { name: 'SBI Cashback', last4: '1207' }],
]);

describe('time helpers (IST is UTC+05:30, no DST)', () => {
  it('turns an India date and time into a UTC instant', () => {
    expect(istInstant('2026-11-27', '09:00')).toBe(Date.UTC(2026, 10, 27, 3, 30));
    expect(istInstant('2027-01-01', '00:15')).toBe(Date.UTC(2026, 11, 31, 18, 45));
  });

  it('formats UTC stamps for calendars', () => {
    expect(formatUtcStamp(Date.UTC(2026, 10, 27, 3, 30))).toBe('20261127T033000Z');
  });
});

describe('buildNotices: one reminder per day, never an amount', () => {
  const notices = buildNotices(events, { dueDates });

  it('coalesces each date into one notice at 9:00 am IST', () => {
    expect(notices.map((n) => [n.date, n.title])).toEqual([
      ['2026-11-27', 'Pay day: 3 card bills'],
      ['2026-12-03', '1 bill due today'],
      ['2026-12-05', '1 bill due today'],
      ['2026-12-07', '1 bill due today'],
    ]);
    expect(notices[0]?.fireAt).toBe(istInstant('2026-11-27', '09:00'));
  });

  it('says when the bills are due and how to act, without card names by default', () => {
    expect(notices[0]?.body).toBe('Due 3, 5 and 7 Dec. Tap to open. Ignore if already paid.');
    expect(JSON.stringify(notices)).not.toMatch(/HDFC|4821|₹|amount|paise/i);
  });

  it('names cards (last 4 only) only when the user opts in', () => {
    const named = buildNotices(events, { dueDates, labels, contentLevel: 'cards' });
    expect(named[0]?.body).toBe(
      'HDFC Regalia ••4821, Axis Flipkart ••9033, SBI Cashback ••1207. Due 3, 5 and 7 Dec. Tap to open. Ignore if already paid.',
    );
  });

  it('has stable ids and tags, so re-planning never duplicates a reminder', () => {
    const again = buildNotices(events, { dueDates });
    expect(again.map((n) => n.itemId)).toEqual(notices.map((n) => n.itemId));
    expect(new Set(notices.map((n) => n.itemId)).size).toBe(notices.length);
    expect(notices[0]?.tag).toBe('creditq-2026-11-27');
  });

  it('respects a custom reminder time', () => {
    const evening = buildNotices(events, { dueDates, time: '19:30' });
    expect(evening[0]?.fireAt).toBe(istInstant('2026-11-27', '19:30'));
  });
});

describe('toIcs (RFC 5545)', () => {
  const notices = buildNotices(events, { dueDates });
  const ics = toIcs(notices, { dtstamp: Date.UTC(2026, 10, 20, 6, 0) });

  it('is a valid calendar with CRLF line endings and one event per notice', () => {
    expect(
      ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CreditQ//reminders 1//EN\r\n'),
    ).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('BEGIN:VEVENT').length - 1).toBe(4);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it('writes the first event exactly (golden)', () => {
    const first = ics.slice(ics.indexOf('BEGIN:VEVENT'), ics.indexOf('END:VEVENT') + 10);
    expect(first.split('\r\n')).toEqual([
      'BEGIN:VEVENT',
      `UID:${notices[0]?.itemId}@creditq.invalid`,
      'DTSTAMP:20261120T060000Z',
      'DTSTART:20261127T033000Z',
      'DURATION:PT15M',
      'SUMMARY:Pay day: 3 card bills',
      'DESCRIPTION:Due 3\\, 5 and 7 Dec. Tap to open. Ignore if already paid.',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Pay day: 3 card bills',
      'TRIGGER:PT0S',
      'END:VALARM',
      'END:VEVENT',
    ]);
  });

  it('folds long lines at 75 octets and escapes special characters', () => {
    const long = toIcs([{ ...notices[0]!, title: `${'x'.repeat(90)};done` }], { dtstamp: 0 });
    const summary = long
      .split('\r\n')
      .filter((l, i, all) => l.startsWith('SUMMARY') || all[i - 1]?.startsWith('SUMMARY'));
    expect(summary[0]?.length).toBe(75);
    expect(summary[1]?.startsWith(' ')).toBe(true);
    expect(long).toContain('\\;done');
  });
});

describe('googleCalendarUrl', () => {
  it('builds a template link with only generic text', () => {
    const [n] = buildNotices(events, { dueDates });
    const url = new URL(googleCalendarUrl(n!));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Pay day: 3 card bills');
    expect(url.searchParams.get('dates')).toBe('20261127T033000Z/20261127T034500Z');
  });
});
