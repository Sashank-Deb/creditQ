/**
 * Picks the one bill each card shows on Home, following the monthly cycle:
 * - after a bill is paid, the card sits in the paid deck until its next bill is generated
 *   (the next statement date), then comes back as due on its own;
 * - cards added before statement dates existed stay "Paid" until the paid due date passes.
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
    const open = mine.find((b) => b.status === 'open');
    const lastPaid = mine.filter((b) => b.status === 'paid').at(-1);

    // Is the open bill live yet? With a statement date: from that date. Without one
    // (older cards): once the paid bill's due date has passed. A card with no paid
    // bill yet is always live, so a brand-new card shows as due straight away.
    let openIsLive = Boolean(open);
    if (open && lastPaid) {
      openIsLive = open.statementDate
        ? compareDates(open.statementDate, today) <= 0
        : compareDates(lastPaid.dueDate, today) < 0;
    }

    const shown = openIsLive ? open : (lastPaid ?? open);
    if (shown) {
      const paymentId = paymentFor.get(shown.id);
      const isPaid = shown.status === 'paid';
      out.push({
        id: card.id,
        name: card.name,
        last4: card.last4,
        tone: card.tone,
        ...(card.bank ? { bank: card.bank } : {}),
        ...(card.pattern ? { pattern: card.pattern } : {}),
        dueDate: shown.dueDate,
        ...(shown.statementDate ? { statementDate: shown.statementDate } : {}),
        billId: shown.id,
        ...(paymentId ? { paymentId } : {}),
        ...(isPaid && open?.statementDate ? { nextStatementDate: open.statementDate } : {}),
      });
      if (isPaid) paidCardIds.push(card.id);
    }
  }
  return { cards: out, paidCardIds };
};
