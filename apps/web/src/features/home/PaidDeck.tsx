'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IssuerBadge } from '@/components/CardTile';
import type { DeckCard } from './home-view';
import styles from './PaidDeck.module.scss';

/**
 * Paid cards, stacked like a deck: each shows only a thin strip (badge, name, last 4);
 * tapping one brings it to the top, fully open, with its details and an edit link.
 */
export default function PaidDeck({ cards }: { cards: readonly DeckCard[] }) {
  const [topId, setTopId] = useState<string | null>(null);
  if (cards.length === 0) return null;
  const top = cards.find((c) => c.cardId === topId) ?? cards[0];
  if (!top) return null;
  // The open card renders last so it sits on top of the stack.
  const ordered = [...cards.filter((c) => c.cardId !== top.cardId), top];

  return (
    <section className={styles.section} aria-labelledby="paid-heading">
      <h2 id="paid-heading" className={styles.heading}>
        Paid this cycle
        <span className={styles.count}>{cards.length}</span>
      </h2>
      <ol className={styles.deck}>
        {ordered.map((c) => {
          const isTop = c.cardId === top.cardId;
          return (
            <li
              key={c.cardId}
              className={`${styles.card} ${styles[`tone-${c.tone}`]} ${isTop ? styles.top : ''}`}
            >
              {isTop ? (
                <div className={styles.face}>
                  <div className={styles.row}>
                    <IssuerBadge issuer={c.issuer} />
                    <span className={styles.name}>{c.name}</span>
                    <span className={styles.digits}>•••• {c.last4}</span>
                  </div>
                  <p className={styles.label}>
                    <span className={styles.tick} aria-hidden="true">
                      ✓
                    </span>
                    {c.label}
                  </p>
                  <Link href={`/card?id=${encodeURIComponent(c.cardId)}`} className={styles.edit}>
                    Edit card
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.strip}
                  onClick={() => setTopId(c.cardId)}
                  aria-label={`${c.name} ending ${c.last4}, paid. Show this card`}
                >
                  <IssuerBadge issuer={c.issuer} />
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.digits}>•••• {c.last4}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
