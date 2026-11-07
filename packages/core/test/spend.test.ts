import { describe, expect, it } from 'vitest';
import { aggregateSpend, type SpendPayment } from '../src';

const pay = (cardId: string, paidOn: string, rupees: number | null): SpendPayment => ({
  cardId,
  paidOn,
  amountPaise: rupees === null ? null : rupees * 100,
});

describe('aggregateSpend (only what the user logged when marking paid)', () => {
  const payments = [
    pay('hdfc', '2026-11-03', 12000),
    pay('axis', '2026-11-05', 4500),
    pay('hdfc', '2026-10-04', 9000),
    pay('sbi', '2026-10-20', null), // skipped the amount
    pay('axis', '2026-05-01', 700), // outside a 6-month window ending Nov
  ];
  const s = aggregateSpend(payments, { endMonth: '2026-11', months: 6 });

  it('returns the last N months oldest first, including empty months', () => {
    expect(s.months.map((m) => [m.key, m.label, m.totalPaise])).toEqual([
      ['2026-06', 'Jun', 0],
      ['2026-07', 'Jul', 0],
      ['2026-08', 'Aug', 0],
      ['2026-09', 'Sep', 0],
      ['2026-10', 'Oct', 900000],
      ['2026-11', 'Nov', 1650000],
    ]);
  });

  it('splits each month by card', () => {
    expect(s.months.at(-1)?.byCard).toEqual({ hdfc: 1200000, axis: 450000 });
  });

  it('counts logged and skipped payments, and never treats a skipped amount as zero spend', () => {
    expect(s.loggedCount).toBe(3);
    expect(s.skippedCount).toBe(1);
    expect(s.months.find((m) => m.key === '2026-10')?.skippedCount).toBe(1);
  });

  it('crosses year boundaries', () => {
    const y = aggregateSpend([pay('a', '2026-12-31', 1)], { endMonth: '2027-02', months: 3 });
    expect(y.months.map((m) => [m.key, m.totalPaise])).toEqual([
      ['2026-12', 100],
      ['2027-01', 0],
      ['2027-02', 0],
    ]);
  });

  it('is empty but well formed with no payments', () => {
    const e = aggregateSpend([], { endMonth: '2026-11', months: 6 });
    expect(e.months).toHaveLength(6);
    expect(e.loggedCount).toBe(0);
  });
});
