/**
 * Picks the one bill each card shows on Home: a bill paid this cycle stays visible as
 * "Paid" until its due date passes, then next month's open bill takes over.
 */
import { compareDates, type CivilDate } from '@creditq/core';
import type { Bill, Card, Payment } from '@creditq/vault';
import type { CardRecord } from './home-view';

export interface HomeCard extends CardRecord {
  billId: string;
  paymentId?: string;
}

export const currentBills = (
  cards: readonly Card[],
  bills: readonly Bill[],
  payments: readonly Payment[],
  today: CivilDate,
): { cards: HomeCard[]; paidCardIds: string[] } => {
  const paymentFor = new Map(payments.map((p) => [p.billId, p.id]));
  const out: HomeCard[] = [];
  const paidCardIds: string[] = [];

  for (const card of cards) {
    const mine = bills
      .filter((b) => b.cardId === card.id)
      .sort((a, b) => compareDates(a.dueDate, b.dueDate));
    const paidThisCycle = mine.find(
      (b) => b.status === 'paid' && compareDates(b.dueDate, today) >= 0,
    );
    const open = mine.find((b) => b.status === 'open');
    const shown = paidThisCycle ?? open;
    if (shown) {
      const paymentId = paymentFor.get(shown.id);
      out.push({
        id: card.id,
        name: card.name,
        last4: card.last4,
        holder: '',
        tone: card.tone,
        dueDate: shown.dueDate,
        billId: shown.id,
        ...(paymentId ? { paymentId } : {}),
      });
      if (shown.status === 'paid') paidCardIds.push(card.id);
    }
  }
  return { cards: out, paidCardIds };
};
