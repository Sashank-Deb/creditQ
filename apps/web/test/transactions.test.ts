import { describe, expect, it } from 'vitest';
import {
  listTransactions,
  monthlyHistory,
  type TxnPayment,
} from '../src/features/transactions/transactions';

const pay = (
  id: string,
  cardId: string,
  paidOn: string,
  amountPaise: number | null,
  createdAt: number,
): TxnPayment => ({ id, cardId, paidOn, amountPaise, createdAt });

describe('monthlyHistory (a month with no payment counts as unpaid)', () => {
  it('lists every month from the first to today, newest first, marking gaps unpaid', () => {
    const rows = monthlyHistory({
      startMonth: '2026-09',
      today: '2026-11-09',
      payments: [pay('p1', 'a', '2026-09-20', 1200_00, 1), pay('p2', 'a', '2026-11-05', null, 2)],
    });
    expect(rows.map((r) => [r.month, r.label, r.status])).toEqual([
      ['2026-11', 'November 2026', 'paid'],
      ['2026-10', 'October 2026', 'unpaid'],
      ['2026-09', 'September 2026', 'paid'],
    ]);
    expect(rows[2]?.payments).toEqual([{ id: 'p1', paidOn: '2026-09-20', amountPaise: 120000 }]);
    expect(rows[1]?.payments).toEqual([]);
  });

  it('keeps every payment of a month, in date order', () => {
    const rows = monthlyHistory({
      startMonth: '2026-11',
      today: '2026-11-30',
      payments: [pay('p2', 'a', '2026-11-20', 50, 2), pay('p1', 'a', '2026-11-03', 25, 1)],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.payments.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('starts earlier when a payment predates the start month', () => {
    const rows = monthlyHistory({
      startMonth: '2026-11',
      today: '2026-11-09',
      payments: [pay('p1', 'a', '2026-09-01', null, 1)],
    });
    expect(rows.map((r) => r.month)).toEqual(['2026-11', '2026-10', '2026-09']);
  });

  it('shows the start month as unpaid when nothing was paid yet', () => {
    const rows = monthlyHistory({ startMonth: '2026-11', today: '2026-11-09', payments: [] });
    expect(rows.map((r) => [r.month, r.status])).toEqual([['2026-11', 'unpaid']]);
  });

  it('crosses a year boundary', () => {
    const rows = monthlyHistory({ startMonth: '2026-11', today: '2027-01-05', payments: [] });
    expect(rows.map((r) => r.month)).toEqual(['2027-01', '2026-12', '2026-11']);
  });
});

describe('listTransactions', () => {
  const payments = [
    pay('p1', 'a', '2026-10-05', 100, 1),
    pay('p2', 'a', '2026-11-05', 200, 2),
    pay('p3', 'b', '2026-11-01', null, 3),
  ];

  it('lists newest first', () => {
    expect(listTransactions(payments).map((t) => t.id)).toEqual(['p2', 'p3', 'p1']);
  });

  it('lets only the latest payment of each card be reverted', () => {
    const byId = Object.fromEntries(listTransactions(payments).map((t) => [t.id, t.canRevert]));
    expect(byId).toEqual({ p1: false, p2: true, p3: true });
  });
});
