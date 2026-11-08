import { describe, expect, it } from 'vitest';
import { buildHomeView, type CardRecord } from '../src/features/home/home-view';

const cards: CardRecord[] = [
  { id: 'hdfc', name: 'HDFC Regalia', last4: '4821', dueDate: '2026-03-08', tone: 'forest' },
  { id: 'axis', name: 'Axis Flipkart', last4: '9033', dueDate: '2026-03-10', tone: 'terracotta' },
  { id: 'sbi', name: 'SBI Cashback', last4: '1207', dueDate: '2026-03-12', tone: 'sand' },
];
// 2026-03-02 is a Monday: the week runs to Sunday 8 Mar. These three share the pay day Tue 3 Mar.
const MONDAY = '2026-03-02';

describe('pay day this week: cards listed individually, each with its own payment button', () => {
  const view = buildHomeView({ today: MONDAY, cards, paidCardIds: [] });

  it('lists every card whose pay day falls in this Monday to Sunday week', () => {
    expect(view.tiles.map((t) => [t.cardId, t.dueLabel])).toEqual([
      ['hdfc', 'Due Sun, 8 Mar'],
      ['axis', 'Due Tue, 10 Mar'],
      ['sbi', 'Due Thu, 12 Mar'],
    ]);
    expect(view.dueSoonCount).toBe(3);
    expect(view.decks).toEqual({ recent: [], paid: [], generated: [] });
  });

  it('shows the club pay day once, then "Same pay day" for the rest of the group', () => {
    expect(view.tiles.map((t) => t.pill)).toEqual([
      'Pay day tomorrow',
      'Same pay day',
      'Same pay day',
    ]);
  });

  it('marks every individual card as actionable', () => {
    expect(view.tiles.every((t) => t.isFocus)).toBe(true);
  });

  it('carries no amounts', () => {
    expect(JSON.stringify(view)).not.toMatch(/₹|amount/i);
  });
});

describe('pay day after this week: the "Bill generated" deck', () => {
  it('moves cards whose bill exists but whose pay day is next week into the deck', () => {
    // Thursday 26 Feb: the week ends Sunday 1 Mar, and the pay day is Tue 3 Mar.
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.tiles).toEqual([]);
    expect(view.dueSoonCount).toBe(0);
    expect(view.decks.generated.map((d) => [d.cardId, d.status, d.note])).toEqual([
      ['hdfc', 'Pay day Tue, 3 Mar', 'Due Sun, 8 Mar'],
      ['axis', 'Pay day Tue, 3 Mar', 'Due Tue, 10 Mar'],
      ['sbi', 'Pay day Tue, 3 Mar', 'Due Thu, 12 Mar'],
    ]);
  });

  it('splits one wallet by week: this week individual, later ones in the deck', () => {
    // Friday 6 Mar: week ends Sun 8 Mar. A is due Wed 11 Mar (pay day Fri 6 Mar, today).
    // B is due Fri 20 Mar, more than 7 days after A, so it has its own pay day, Fri 13 Mar.
    const view = buildHomeView({
      today: '2026-03-06',
      cards: [
        { id: 'a', name: 'HDFC A', last4: '1111', dueDate: '2026-03-11', tone: 'forest' },
        { id: 'b', name: 'Axis B', last4: '2222', dueDate: '2026-03-20', tone: 'olive' },
      ],
      paidCardIds: [],
    });
    expect(view.tiles.map((t) => t.cardId)).toEqual(['a']);
    expect(view.decks.generated.map((d) => [d.cardId, d.status])).toEqual([
      ['b', 'Pay day Fri, 13 Mar'],
    ]);
  });

  it('keeps a missed pay day individual so it can still be paid', () => {
    // Wednesday 4 Mar: the pay day (Tue 3 Mar) has passed; today is the catch-up day.
    const view = buildHomeView({ today: '2026-03-04', cards, paidCardIds: [] });
    expect(view.tiles.map((t) => t.cardId)).toEqual(['hdfc', 'axis', 'sbi']);
  });

  it('keeps a missed pay day individual even when the catch-up day is next Monday', () => {
    // Sunday 8 Mar: the pay day (Tue 3 Mar) was missed and the next working day is Monday 9 Mar,
    // which is next week. The cards are still due, so they stay listed and payable.
    const view = buildHomeView({ today: '2026-03-08', cards, paidCardIds: [] });
    expect(view.tiles.map((t) => t.cardId)).toEqual(['hdfc', 'axis', 'sbi']);
    expect(view.decks.generated).toEqual([]);
  });

  it('is clubbed no earlier than the Settings lead days before the earliest due date', () => {
    // Lead 3 days: due Sun 8 Mar minus 3 is Thu 5 Mar, so on Mon 2 Mar it is still this week.
    const view = buildHomeView({ today: MONDAY, cards, paidCardIds: [], leadDays: 3 });
    expect(view.tiles[0]?.pill).toBe('Pay day in 3 days');
    // Lead 10 days: the ideal pay day is already behind us, so it is a catch-up today.
    const early = buildHomeView({ today: MONDAY, cards, paidCardIds: [], leadDays: 10 });
    expect(early.tiles[0]?.pill).toBe('Pay day today');
  });
});

describe('Recently added: a bill that is not generated yet', () => {
  const pending = { ...cards[0], dueDate: '2026-03-30', statementDate: '2026-03-12' };

  it('goes into its own deck with the day it generates and its planned pay day', () => {
    const view = buildHomeView({ today: '2026-02-26', cards: [pending], paidCardIds: [] });
    expect(view.tiles).toEqual([]);
    expect(view.decks.recent.map((d) => [d.cardId, d.status, d.note])).toEqual([
      ['hdfc', 'Bill generates Thu, 12 Mar', 'Pay day Wed, 25 Mar · Due Mon, 30 Mar'],
    ]);
  });

  it('becomes an ordinary card once the bill is generated and its pay day is near', () => {
    // Tue 24 Mar: the week ends Sun 29 Mar and the pay day is Wed 25 Mar.
    const view = buildHomeView({ today: '2026-03-24', cards: [pending], paidCardIds: [] });
    expect(view.decks.recent).toEqual([]);
    expect(view.tiles.map((t) => t.cardId)).toEqual(['hdfc']);
  });

  it('still plans the pay day, never before the bill exists', () => {
    const view = buildHomeView({ today: '2026-02-26', cards: [pending], paidCardIds: [] });
    expect(view.timeline.find((t) => t.kind === 'pay-day')?.date).toBe('2026-03-25');
  });
});

describe('Paid deck', () => {
  it('holds paid cards with when their next bill arrives', () => {
    const withNext = cards.map((c) =>
      c.id === 'hdfc' ? { ...c, nextStatementDate: '2026-03-20' } : c,
    );
    const view = buildHomeView({ today: MONDAY, cards: withNext, paidCardIds: ['hdfc'] });
    expect(view.decks.paid.map((d) => [d.cardId, d.status, d.note])).toEqual([
      ['hdfc', 'Paid', 'Next bill Fri, 20 Mar'],
    ]);
    expect(view.tiles.map((t) => t.cardId)).toEqual(['axis', 'sbi']);
    expect(view.dueSoonCount).toBe(2);
  });

  it('shows an all-paid state', () => {
    const view = buildHomeView({ today: MONDAY, cards, paidCardIds: ['hdfc', 'axis', 'sbi'] });
    expect(view.dueSoonCount).toBe(0);
    expect(view.tiles).toEqual([]);
    expect(view.decks.paid).toHaveLength(3);
    expect(view.banner).toBe('All paid. Nothing to do until your next statement.');
  });
});

describe('badges and style', () => {
  it('takes the badge from the bank, not the card name', () => {
    const view = buildHomeView({
      today: MONDAY,
      cards: [{ ...cards[0], name: 'Premier', bank: 'HSBC', pattern: 'dots' }],
      paidCardIds: [],
    });
    expect(view.tiles[0]).toMatchObject({ name: 'Premier', pattern: 'dots' });
    expect(view.tiles[0]?.issuer.monogram).toBe('HSBC');
  });

  it('puts each card under a brand-style monogram, never a logo', () => {
    const view = buildHomeView({ today: MONDAY, cards, paidCardIds: [] });
    expect(view.tiles.map((t) => t.issuer.monogram)).toEqual(['HDFC', 'AXIS', 'SBI']);
  });
});

describe('empty state, banner and calendar', () => {
  it('shows the empty state with no cards', () => {
    const view = buildHomeView({ today: MONDAY, cards: [], paidCardIds: [] });
    expect(view.isEmpty).toBe(true);
    expect(view.tiles).toEqual([]);
    expect(view.decks).toEqual({ recent: [], paid: [], generated: [] });
  });

  it('names the grouped pay day in the status line', () => {
    const view = buildHomeView({ today: MONDAY, cards, paidCardIds: [] });
    expect(view.banner).toBe('Reminders on. Pay day: Tue, 3 Mar at 9:00 am.');
  });

  it('marks only the pay day on a calendar for the pay day month, never due dates', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.calendar).toEqual({
      month: '2026-03',
      title: 'March 2026',
      today: '2026-02-26',
      payDays: ['2026-03-03'],
    });
  });

  it('shows the current month on the calendar when everything is paid', () => {
    const view = buildHomeView({
      today: '2026-03-03',
      cards,
      paidCardIds: ['hdfc', 'axis', 'sbi'],
    });
    expect(view.calendar).toMatchObject({ month: '2026-03', payDays: [] });
  });
});

describe('statement dates on Home', () => {
  it('never shows a pay day before the bill is generated', () => {
    const view = buildHomeView({
      today: '2026-11-01',
      cards: [{ ...cards[0], dueDate: '2026-11-20', statementDate: '2026-11-18' }],
      paidCardIds: [],
    });
    expect(view.banner).toBe('Reminders on. Pay day: Wed, 18 Nov at 9:00 am.');
  });
});

describe('reminder timeline (the status section)', () => {
  it('starts at today and lists the pay days only: no due dates, no heads-ups', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.timeline.map((t) => [t.kind, t.date, t.label, t.detail])).toEqual([
      ['today', '2026-02-26', 'Today', 'Thu, 26 Feb'],
      ['pay-day', '2026-03-03', 'Pay day', 'Tue, 3 Mar · 3 bills'],
    ]);
  });

  it('lists each separate pay day in order', () => {
    const view = buildHomeView({
      today: '2026-03-06',
      cards: [
        { id: 'a', name: 'HDFC A', last4: '1111', dueDate: '2026-03-11', tone: 'forest' },
        { id: 'b', name: 'Axis B', last4: '2222', dueDate: '2026-03-20', tone: 'olive' },
      ],
      paidCardIds: [],
    });
    expect(view.timeline.map((t) => [t.kind, t.date])).toEqual([
      ['today', '2026-03-06'],
      ['pay-day', '2026-03-06'],
      ['pay-day', '2026-03-13'],
    ]);
  });

  it('drops paid cards from the timeline and shows only Today when nothing is left', () => {
    const view = buildHomeView({
      today: '2026-03-03',
      cards,
      paidCardIds: ['hdfc', 'axis', 'sbi'],
    });
    expect(view.timeline.map((t) => t.kind)).toEqual(['today']);
  });

  it('carries no amounts', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(JSON.stringify(view.timeline)).not.toMatch(/₹|amount/i);
  });
});

describe('a missed pay day', () => {
  it('shows "Pay day missed" with the date it was, then the catch-up pay day', () => {
    const view = buildHomeView({ today: '2026-03-05', cards, paidCardIds: [] });
    expect(view.timeline.map((t) => [t.kind, t.date, t.label, t.detail])).toEqual([
      ['today', '2026-03-05', 'Today', 'Thu, 5 Mar'],
      ['missed', '2026-03-03', 'Pay day missed', 'Tue, 3 Mar · 3 bills'],
      ['pay-day', '2026-03-05', 'Pay day', 'Thu, 5 Mar · 3 bills'],
    ]);
  });

  it('is not missed while the pay day is today or later', () => {
    const view = buildHomeView({ today: '2026-03-03', cards, paidCardIds: [] });
    expect(view.timeline.some((t) => t.kind === 'missed')).toBe(false);
    expect(view.timeline[1]).toMatchObject({ kind: 'pay-day', date: '2026-03-03' });
  });

  it('is not missed once the remaining cards have a later pay day of their own', () => {
    const view = buildHomeView({ today: '2026-03-05', cards, paidCardIds: ['hdfc'] });
    expect(view.timeline.some((t) => t.kind === 'missed')).toBe(false);
  });

  it('is not missed when everything is paid', () => {
    const view = buildHomeView({
      today: '2026-03-05',
      cards,
      paidCardIds: ['hdfc', 'axis', 'sbi'],
    });
    expect(view.timeline.map((t) => t.kind)).toEqual(['today']);
  });
});
