'use client';

import { useState } from 'react';
import { formatRupees, formatShortDate } from '@creditq/core';
import type { Card, Payment } from '@creditq/vault';
import { todayInIndia } from '@/lib/today';
import RevertDialog from './RevertDialog';
import UndoIcon from './UndoIcon';
import { listTransactions, monthlyHistory } from './transactions';
import styles from './CardTransactions.module.scss';

interface CardTransactionsProps {
  card: Card;
  payments: readonly Payment[];
  today: string;
}

/** Every month of the card, with its payment, or "Unpaid" when nothing was recorded. */
export default function CardTransactions({ card, payments, today }: CardTransactionsProps) {
  const [target, setTarget] = useState<string | null>(null);
  const canRevert = new Map(listTransactions(payments).map((t) => [t.id, t.canRevert]));
  const targetPayment = payments.find((p) => p.id === target);
  const amountLabel = (paise: number | null) =>
    paise === null ? 'No amount logged' : formatRupees(paise);
  const rows = monthlyHistory({
    startMonth: todayInIndia(new Date(card.createdAt)).slice(0, 7),
    today,
    payments,
  });

  return (
    <section className={styles.panel} aria-label={`All transactions for ${card.name}`}>
      <h1 className={styles.title}>All transactions</h1>
      <p className={styles.hint}>A month with no payment recorded counts as unpaid.</p>
      <ol className={styles.months}>
        {rows.map((row) => (
          <li key={row.month} className={styles.month}>
            <div className={styles.head}>
              <h2 className={styles.label}>{row.label}</h2>
              <span className={row.status === 'paid' ? styles.paid : styles.unpaid}>
                {row.status === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
            {row.payments.length === 0 ? (
              <p className={styles.empty}>No payment recorded.</p>
            ) : (
              <ul className={styles.payments}>
                {row.payments.map((p) => (
                  <li key={p.id} className={styles.payment}>
                    <span>Paid {formatShortDate(p.paidOn)}</span>
                    <span className={styles.amount}>{amountLabel(p.amountPaise)}</span>
                    <button
                      type="button"
                      className={styles.revert}
                      disabled={!canRevert.get(p.id)}
                      title={
                        canRevert.get(p.id)
                          ? 'Revert this payment'
                          : 'Only the latest payment of a card can be reverted'
                      }
                      aria-label={`Revert payment of ${amountLabel(p.amountPaise)} on ${formatShortDate(p.paidOn)}`}
                      onClick={() => setTarget(p.id)}
                    >
                      <UndoIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <RevertDialog
        target={
          targetPayment
            ? {
                id: targetPayment.id,
                summary: `${card.name}, ${amountLabel(targetPayment.amountPaise)} on ${formatShortDate(targetPayment.paidOn)}.`,
              }
            : null
        }
        onClose={() => setTarget(null)}
      />
    </section>
  );
}
