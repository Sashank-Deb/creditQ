import { describe, expect, it } from 'vitest';
import type { Bill, Card, Payment } from '@creditq/vault';
import { currentBills } from '../src/features/home/current-bills';

const card = (id: string, tone: Card['tone'] = 'forest'): Card => ({
  id,
  name: id.toUpperCase(),
  last4: '0000',
  tone,
  dueDay: 8,
  createdAt: 0,
});
const bill = (id: string, cardId: string, dueDate: string, status: Bill['status']): Bill => ({
  id,
  cardId,
  dueDate,
  status,
  createdAt: 0,
});
const payment = (billId: string): Payment => ({
  id: `p-${billId}`,
  billId,
  cardId: 'x',
  amountPaise: null,
  paidOn: '2026-03-03',
  nextBillId: 'n',
  createdAt: 0,
});

describe('currentBills: which bill each card shows on Home', () => {
  it('shows the open bill', () => {
    const r = currentBills([card('a')], [bill('a1', 'a', '2026-03-08', 'open')], [], '2026-03-01');
    expect(r.cards.map((c) => [c.id, c.billId, c.dueDate])).toEqual([['a', 'a1', '2026-03-08']]);
    expect(r.paidCardIds).toEqual([]);
  });

  it('keeps showing a paid bill as Paid until its due date passes', () => {
    const bills = [bill('a1', 'a', '2026-03-08', 'paid'), bill('a2', 'a', '2026-04-08', 'open')];
    const during = currentBills([card('a')], bills, [payment('a1')], '2026-03-05');
    expect(during.cards[0]).toMatchObject({ billId: 'a1', paymentId: 'p-a1' });
    expect(during.paidCardIds).toEqual(['a']);

    const after = currentBills([card('a')], bills, [payment('a1')], '2026-03-09');
    expect(after.cards[0]).toMatchObject({ billId: 'a2', dueDate: '2026-04-08' });
    expect(after.paidCardIds).toEqual([]);
  });

  it('includes cards with past-due open bills so they are not hidden', () => {
    const r = currentBills([card('a')], [bill('a1', 'a', '2026-02-20', 'open')], [], '2026-03-01');
    expect(r.cards[0]?.dueDate).toBe('2026-02-20');
  });
});
