import { describe, expect, it } from 'vitest';
import type { Bill, Card, Payment } from '@creditq/vault';
import { currentBills } from '../src/features/home/current-bills';

const card = (id: string): Card => ({
  id,
  name: id.toUpperCase(),
  last4: '0000',
  tone: 'forest',
  dueDay: 8,
  createdAt: 0,
});
const bill = (
  id: string,
  dueDate: string,
  status: Bill['status'],
  statementDate?: string,
): Bill => ({
  id,
  cardId: 'a',
  dueDate,
  status,
  createdAt: 0,
  ...(statementDate ? { statementDate } : {}),
});
const payment = (billId: string): Payment => ({
  id: `p-${billId}`,
  billId,
  cardId: 'a',
  amountPaise: null,
  paidOn: '2026-03-03',
  nextBillId: 'n',
  createdAt: 0,
});

describe('currentBills: which bill each card shows on Home', () => {
  it('shows the open bill as due', () => {
    const r = currentBills([card('a')], [bill('a1', '2026-03-08', 'open')], [], '2026-03-01');
    expect(r.cards.map((c) => [c.id, c.billId, c.dueDate])).toEqual([['a', 'a1', '2026-03-08']]);
    expect(r.paidCardIds).toEqual([]);
  });

  it('keeps a paid card in the deck until its next statement date, then brings it back as due', () => {
    const bills = [
      bill('a1', '2026-03-08', 'paid', '2026-02-18'),
      bill('a2', '2026-04-08', 'open', '2026-03-18'),
    ];
    const before = currentBills([card('a')], bills, [payment('a1')], '2026-03-17');
    expect(before.paidCardIds).toEqual(['a']);
    expect(before.cards[0]).toMatchObject({
      billId: 'a1',
      paymentId: 'p-a1',
      nextStatementDate: '2026-03-18',
    });

    const after = currentBills([card('a')], bills, [payment('a1')], '2026-03-18');
    expect(after.paidCardIds).toEqual([]);
    expect(after.cards[0]).toMatchObject({ billId: 'a2', dueDate: '2026-04-08' });
  });

  it('without a statement date, keeps Paid until the paid due date passes (older cards)', () => {
    const bills = [bill('a1', '2026-03-08', 'paid'), bill('a2', '2026-04-08', 'open')];
    expect(currentBills([card('a')], bills, [payment('a1')], '2026-03-05').paidCardIds).toEqual([
      'a',
    ]);
    expect(currentBills([card('a')], bills, [payment('a1')], '2026-03-09').cards[0]?.billId).toBe(
      'a2',
    );
  });

  it('shows a brand-new card as due even if its statement date is ahead', () => {
    const r = currentBills(
      [card('a')],
      [bill('a1', '2026-03-28', 'open', '2026-03-08')],
      [],
      '2026-03-01',
    );
    expect(r.paidCardIds).toEqual([]);
  });

  it('includes cards with past-due open bills so they are not hidden', () => {
    const r = currentBills([card('a')], [bill('a1', '2026-02-20', 'open')], [], '2026-03-01');
    expect(r.cards[0]?.dueDate).toBe('2026-02-20');
  });
});
