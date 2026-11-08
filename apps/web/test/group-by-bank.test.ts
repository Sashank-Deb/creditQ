import { describe, expect, it } from 'vitest';
import { groupSpendByBank } from '../src/features/spends/group-by-bank';

const card = (id: string, bank?: string) => ({
  id,
  name: id,
  last4: '0000',
  ...(bank ? { bank } : {}),
});

describe('groupSpendByBank', () => {
  it('totals every card of a bank, largest first', () => {
    const rows = groupSpendByBank(
      [card('a', 'HDFC Bank'), card('b', 'HDFC Bank'), card('c', 'Axis Bank')],
      { a: 10_000, b: 5_000, c: 30_000 },
    );
    expect(rows).toEqual([
      { bank: 'Axis Bank', paise: 30_000, cardCount: 1 },
      { bank: 'HDFC Bank', paise: 15_000, cardCount: 2 },
    ]);
  });

  it('ignores cards with nothing paid that month', () => {
    const rows = groupSpendByBank([card('a', 'HDFC Bank'), card('b', 'Axis Bank')], { a: 100 });
    expect(rows.map((r) => r.bank)).toEqual(['HDFC Bank']);
  });

  it('puts cards without a bank under Other', () => {
    const rows = groupSpendByBank([card('a'), card('b', 'Other')], { a: 100, b: 50 });
    expect(rows).toEqual([{ bank: 'Other', paise: 150, cardCount: 2 }]);
  });

  it('treats bank names case-insensitively and ignores spaces', () => {
    const rows = groupSpendByBank([card('a', 'Kotak'), card('b', ' kotak ')], { a: 1, b: 2 });
    expect(rows).toEqual([{ bank: 'Kotak', paise: 3, cardCount: 2 }]);
  });

  it('breaks ties by bank name so the order is stable', () => {
    const rows = groupSpendByBank([card('a', 'Zeta'), card('b', 'Alpha')], { a: 5, b: 5 });
    expect(rows.map((r) => r.bank)).toEqual(['Alpha', 'Zeta']);
  });
});
