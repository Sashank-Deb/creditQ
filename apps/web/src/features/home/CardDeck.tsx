'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { IssuerBadge } from '@/components/CardTile';
import { deckPositions } from './deck-order';
import type { DeckCard } from './home-view';
import styles from './CardDeck.module.scss';

function Pencil() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A stacked deck of cards (Recently added, Paid this cycle, Bill generated). Each card shows
 * only a thin strip (badge, name, last 4). Tapping a strip brings that card to the front: it
 * slides down over the others while the rest slide back up into strips, and its face flips
 * open from the top edge. Cards keep their place in the DOM and only move, so every move is
 * a smooth transition.
 */
export default function CardDeck({ title, cards }: { title: string; cards: readonly DeckCard[] }) {
  const headingId = useId();
  const [topId, setTopId] = useState<string | null>(null);
  // The flip only plays after the user picks a card, never on the first paint.
  const [interacted, setInteracted] = useState(false);
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
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {title}
        <span className={styles.count}>{cards.length}</span>
      </h2>
      <ol
        className={`${styles.deck} ${interacted ? styles.interacted : ''}`}
        style={{ '--count': cards.length } as CSSProperties}
      >
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
                    <p className={styles.status}>
                      {c.kind === 'paid' && (
                        <span className={styles.tick} aria-hidden="true">
                          ✓
                        </span>
                      )}
                      {c.status}
                    </p>
                    <Link
                      ref={editRef}
                      href={`/card?id=${encodeURIComponent(c.cardId)}`}
                      className={styles.edit}
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil />
                    </Link>
                  </div>
                  {c.note && <p className={styles.note}>{c.note}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.strip}
                  onClick={() => {
                    picked.current = true;
                    setInteracted(true);
                    setTopId(c.cardId);
                  }}
                  aria-label={`${c.name} ending ${c.last4}, ${c.status}. Show this card`}
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
