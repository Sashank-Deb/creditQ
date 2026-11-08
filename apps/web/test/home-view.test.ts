import { describe, expect, it } from 'vitest';
import { buildHomeView, type CardRecord } from '../src/features/home/home-view';

const cards: CardRecord[] = [
  { id: 'hdfc', name: 'HDFC Regalia', last4: '4821', dueDate: '2026-03-08', tone: 'forest' },
  { id: 'axis', name: 'Axis Flipkart', last4: '9033', dueDate: '2026-03-10', tone: 'terracotta' },
  { id: 'sbi', name: 'SBI Cashback', last4: '1207', dueDate: '2026-03-12', tone: 'sand' },
];

describe('buildHomeView', () => {
  it('shows the grouped pay day, one focus tile, and no amounts', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.dueSoonCount).toBe(3);
    expect(view.banner).toBe('Reminders on. Pay day: Tue, 3 Mar at 9:00 am.');
    expect(view.tiles.map((t) => [t.cardId, t.dueLabel, t.isFocus, t.pill])).toEqual([
      ['hdfc', 'Due Sun, 8 Mar', true, 'Pay day in 5 days'],
      ['axis', 'Due Tue, 10 Mar', false, 'Same pay day'],
      ['sbi', 'Due Thu, 12 Mar', false, 'Same pay day'],
    ]);
    expect(view.deck).toEqual([]);
    expect(JSON.stringify(view)).not.toMatch(/₹|amount/i);
  });

  it('takes the badge from the bank, not the card name', () => {
    const view = buildHomeView({
      today: '2026-02-26',
      cards: [{ ...cards[0], name: 'Premier', bank: 'HSBC', pattern: 'dots' }],
      paidCardIds: [],
    });
    expect(view.tiles[0]).toMatchObject({ name: 'Premier', pattern: 'dots' });
    expect(view.tiles[0]?.issuer.monogram).toBe('HSBC');
  });

  it('puts each card under a brand-style monogram, never a logo', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.tiles.map((t) => t.issuer.monogram)).toEqual(['HDFC', 'AXIS', 'SBI']);
  });

  it('moves paid cards into the deck and the focus to the next unpaid card', () => {
    const view = buildHomeView({ today: '2026-03-03', cards, paidCardIds: ['hdfc'] });
    expect(view.dueSoonCount).toBe(2);
    expect(view.tiles.map((t) => [t.cardId, t.isFocus])).toEqual([
      ['axis', true],
      ['sbi', false],
    ]);
    expect(view.tiles[0]?.pill).toBe('Pay day today');
    expect(view.deck.map((d) => [d.cardId, d.label])).toEqual([['hdfc', 'Paid']]);
  });

  it('tells paid cards when their next bill arrives', () => {
    const withNext = cards.map((c) =>
      c.id === 'hdfc' ? { ...c, nextStatementDate: '2026-03-20' } : c,
    );
    const view = buildHomeView({ today: '2026-03-03', cards: withNext, paidCardIds: ['hdfc'] });
    expect(view.deck[0]?.label).toBe('Paid · next bill Fri, 20 Mar');
  });

  it('shows an all-paid state', () => {
    const view = buildHomeView({
      today: '2026-03-03',
      cards,
      paidCardIds: ['hdfc', 'axis', 'sbi'],
    });
    expect(view.dueSoonCount).toBe(0);
    expect(view.tiles).toEqual([]);
    expect(view.deck).toHaveLength(3);
    expect(view.banner).toBe('All paid. Nothing to do until your next statement.');
  });

  it('shows the empty state with no cards', () => {
    const view = buildHomeView({ today: '2026-03-03', cards: [], paidCardIds: [] });
    expect(view.isEmpty).toBe(true);
    expect(view.tiles).toEqual([]);
  });

  it('marks the pay day and due dates on a calendar for the pay day month', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.calendar).toEqual({
      month: '2026-03',
      title: 'March 2026',
      today: '2026-02-26',
      payDays: ['2026-03-03'],
      dueDates: ['2026-03-08', '2026-03-10', '2026-03-12'],
    });
  });

  it('shows the current month on the calendar when everything is paid', () => {
    const view = buildHomeView({
      today: '2026-03-03',
      cards,
      paidCardIds: ['hdfc', 'axis', 'sbi'],
    });
    expect(view.calendar).toMatchObject({ month: '2026-03', payDays: [], dueDates: [] });
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
  it('starts at today and lists the next reminders in order, with no heads-up rows', () => {
    const view = buildHomeView({ today: '2026-02-26', cards, paidCardIds: [] });
    expect(view.timeline.map((t) => [t.kind, t.date, t.label, t.detail])).toEqual([
      ['today', '2026-02-26', 'Today', 'Thu, 26 Feb'],
      ['pay-day', '2026-03-03', 'Pay day', 'Tue, 3 Mar · 3 bills'],
      ['due', '2026-03-08', 'Due', 'Sun, 8 Mar · 1 bill'],
      ['due', '2026-03-10', 'Due', 'Tue, 10 Mar · 1 bill'],
      ['due', '2026-03-12', 'Due', 'Thu, 12 Mar · 1 bill'],
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
  it('shows "Pay day missed" with the date it was, then the catch-up pay day that will actually remind', () => {
    const view = buildHomeView({ today: '2026-03-05', cards, paidCardIds: [] });
    expect(view.timeline.map((t) => [t.kind, t.date, t.label, t.detail])).toEqual([
      ['today', '2026-03-05', 'Today', 'Thu, 5 Mar'],
      ['missed', '2026-03-03', 'Pay day missed', 'Tue, 3 Mar · 3 bills'],
      ['pay-day', '2026-03-05', 'Pay day', 'Thu, 5 Mar · 3 bills'],
      ['due', '2026-03-08', 'Due', 'Sun, 8 Mar · 1 bill'],
      ['due', '2026-03-10', 'Due', 'Tue, 10 Mar · 1 bill'],
      ['due', '2026-03-12', 'Due', 'Thu, 12 Mar · 1 bill'],
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

describe('a bill that is not generated yet', () => {
  const pending = { ...cards[0], dueDate: '2026-03-30', statementDate: '2026-03-12' };

  it('says when it generates, and holds back "Mark as paid" until then', () => {
    const view = buildHomeView({ today: '2026-02-26', cards: [pending], paidCardIds: [] });
    expect(view.tiles[0]).toMatchObject({
      billPending: true,
      pill: 'Bill generates Thu, 12 Mar',
    });
  });

  it('is an ordinary due card once the statement date has arrived', () => {
    const view = buildHomeView({ today: '2026-03-12', cards: [pending], paidCardIds: [] });
    expect(view.tiles[0]).toMatchObject({ billPending: false });
    expect(view.tiles[0]?.pill).toMatch(/^Pay day/);
  });

  it('still plans the pay day, never before the bill exists', () => {
    const view = buildHomeView({ today: '2026-02-26', cards: [pending], paidCardIds: [] });
    expect(view.timeline.find((t) => t.kind === 'pay-day')?.date).toBe('2026-03-25');
  });
});
