'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { IssuerBadge } from '@/components/CardTile';
import { deckPositions } from './deck-order';
import type { DeckCard } from './home-view';
import styles from './PaidDeck.module.scss';

/**
 * Paid cards, stacked like a deck: each shows only a thin strip (badge, name, last 4).
 * Tapping a strip brings that card to the front: it slides down over the others while the
 * rest slide back up into strips, and its face flips open from the top edge.
 * Cards keep their place in the DOM and only move, so every move is a smooth transition.
 */
export default function PaidDeck({ cards }: { cards: readonly DeckCard[] }) {
  const [topId, setTopId] = useState<string | null>(null);
  const editRef = useRef<HTMLAnchorElement>(null);
  const picked = useRef(false);

  // After the user picks a card its strip button disappears; keep keyboard focus on the card.
  useEffect(() => {
    if (picked.current) editRef.current?.focus({ preventScroll: true });
  }, [topId]);

  if (cards.length === 0) return null;
  const positions = deckPositions(
    cards.map((c) => c.cardId),
    topId,
  );
  const frontPosition = cards.length - 1;

  return (
    <section className={styles.section} aria-labelledby="paid-heading">
      <h2 id="paid-heading" className={styles.heading}>
        Paid this cycle
        <span className={styles.count}>{cards.length}</span>
      </h2>
      <ol className={styles.deck} style={{ '--count': cards.length } as CSSProperties}>
        {cards.map((c) => {
          const position = positions[c.cardId] ?? 0;
          const isFront = position === frontPosition;
          return (
            <li
              key={c.cardId}
              className={`${styles.card} ${styles[`tone-${c.tone}`]} ${styles[`pattern-${c.pattern}`]} ${isFront ? styles.front : ''}`}
              style={{ '--pos': position } as CSSProperties}
            >
              {isFront ? (
                <div className={styles.face}>
                  <div className={styles.row}>
                    <IssuerBadge issuer={c.issuer} />
                    <span className={styles.name}>{c.name}</span>
                    <span className={styles.digits}>•••• {c.last4}</span>
                  </div>
                  <div className={styles.statusRow}>
                    <p className={styles.label}>
                      <span className={styles.tick} aria-hidden="true">
                        ✓
                      </span>
                      {c.label.split(' · ')[0]}
                    </p>
                    <Link
                      ref={editRef}
                      href={`/card?id=${encodeURIComponent(c.cardId)}`}
                      className={styles.edit}
                    >
                      Edit card
                    </Link>
                  </div>
                  {c.label.includes(' · ') && (
                    <p className={styles.next}>{c.label.split(' · ').slice(1).join(' · ')}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.strip}
                  onClick={() => {
                    picked.current = true;
                    setTopId(c.cardId);
                  }}
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
