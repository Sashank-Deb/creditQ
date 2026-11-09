'use client';

import { useState } from 'react';
import { formatRupees, formatShortDate } from '@creditq/core';
import type { Card, Payment } from '@creditq/vault';
import RevertDialog from './RevertDialog';
import UndoIcon from './UndoIcon';
import { listTransactions } from './transactions';
import styles from './TransactionList.module.scss';

interface TransactionListProps {
  cards: readonly Card[];
  payments: readonly Payment[];
}

/** Every payment, newest first, each with an icon button to take it back. */
export default function TransactionList({ cards, payments }: TransactionListProps) {
  const [target, setTarget] = useState<string | null>(null);

  const byCard = new Map(cards.map((c) => [c.id, c]));
  const rows = listTransactions(payments);
  const targetRow = rows.find((r) => r.id === target);
  const targetCard = targetRow ? byCard.get(targetRow.cardId) : undefined;

  if (rows.length === 0) return null;

  const amountLabel = (paise: number | null) =>
    paise === null ? 'No amount logged' : formatRupees(paise);

  return (
    <section className={styles.section} aria-labelledby="all-transactions">
      <h2 id="all-transactions" className={styles.heading}>
        All transactions
        <span className={styles.count}>{rows.length}</span>
      </h2>
      <ul className={styles.list}>
        {rows.map((t) => {
          const card = byCard.get(t.cardId);
          const name = card ? card.name : 'Removed card';
          return (
            <li key={t.id} className={styles.row}>
              <div className={styles.text}>
                <span className={styles.name}>{name}</span>
                <span className={styles.meta}>
                  {card ? `•••• ${card.last4} · ` : ''}
                  {formatShortDate(t.paidOn)}
                </span>
              </div>
              <span className={styles.amount}>{amountLabel(t.amountPaise)}</span>
              <button
                type="button"
                className={styles.revert}
                disabled={!t.canRevert}
                title={
                  t.canRevert
                    ? 'Revert this payment'
                    : 'Only the latest payment of a card can be reverted'
                }
                aria-label={`Revert ${name} payment of ${amountLabel(t.amountPaise)} on ${formatShortDate(t.paidOn)}`}
                onClick={() => {
                  setTarget(t.id);
                }}
              >
                <UndoIcon />
              </button>
            </li>
          );
        })}
      </ul>

      <RevertDialog
        target={
          targetRow
            ? {
                id: targetRow.id,
                summary: `${targetCard ? `${targetCard.name}, ` : ''}${amountLabel(targetRow.amountPaise)} on ${formatShortDate(targetRow.paidOn)}.`,
              }
            : null
        }
        onClose={() => setTarget(null)}
      />
    </section>
  );
}
