import { describe, expect, it } from 'vitest';
import { buildHomeView, type CardRecord } from '../src/features/home/home-view';

const cards: CardRecord[] = [
  {
    id: 'hdfc',
    name: 'HDFC Regalia',
    last4: '4821',
    holder: 'Meera Iyer',
    dueDate: '2026-03-08',
    tone: 'forest',
  },
  {
    id: 'axis',
    name: 'Axis Flipkart',
    last4: '9033',
    holder: 'Meera Iyer',
    dueDate: '2026-03-10',
    tone: 'terracotta',
  },
  {
    id: 'sbi',
    name: 'SBI Cashback',
    last4: '1207',
    holder: 'Meera Iyer',
    dueDate: '2026-03-12',
    tone: 'sand',
  },
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
    expect(JSON.stringify(view)).not.toMatch(/₹|amount/i);
  });

  it('moves the focus to the next unpaid card and drops paid ones from due soon', () => {
    const view = buildHomeView({ today: '2026-03-03', cards, paidCardIds: ['hdfc'] });
    expect(view.dueSoonCount).toBe(2);
    expect(view.tiles.map((t) => [t.cardId, t.isFocus, t.isPaid])).toEqual([
      ['axis', true, false],
      ['sbi', false, false],
      ['hdfc', false, true],
    ]);
    expect(view.tiles[0]?.pill).toBe('Pay day today');
  });

  it('shows an all-paid state', () => {
    const view = buildHomeView({
      today: '2026-03-03',
      cards,
      paidCardIds: ['hdfc', 'axis', 'sbi'],
    });
    expect(view.dueSoonCount).toBe(0);
    expect(view.banner).toBe('All paid. Nothing to do until your next statement.');
  });

  it('shows the empty state with no cards', () => {
    const view = buildHomeView({ today: '2026-03-03', cards: [], paidCardIds: [] });
    expect(view.isEmpty).toBe(true);
    expect(view.tiles).toEqual([]);
  });
});
