import Link from 'next/link';
import type { ReactNode } from 'react';
import { detectIssuer, type Issuer } from '@creditq/core';
import type { TilePattern, TileTone } from '@creditq/vault';
import CardChip from './CardChip';
import styles from './CardTile.module.scss';

interface CardTileProps {
  name: string;
  last4: string;
  tone: TileTone;
  pattern?: TilePattern;
  dueLabel: string;
  issuer?: Issuer;
  focus?: boolean;
  paid?: boolean;
  /** Where the small edit control goes; omitted on previews. */
  editHref?: string;
  actions?: ReactNode;
}

/** Bank badge: a brand-colour monogram, never the bank's logo artwork. */
export function IssuerBadge({ issuer }: { issuer: Issuer }) {
  return (
    <span
      className={styles.badge}
      style={{ background: issuer.color, color: issuer.ink }}
      aria-hidden="true"
    >
      {issuer.monogram}
    </span>
  );
}

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

/** The card tile from design v5. Invented gradients and a monogram badge, no bank logos. */
export default function CardTile({
  name,
  last4,
  tone,
  pattern = 'diamonds',
  dueLabel,
  issuer = undefined,
  focus = false,
  paid = false,
  editHref = undefined,
  actions = null,
}: CardTileProps) {
  const digits = last4.padEnd(4, '•');
  const badge = issuer ?? detectIssuer(name || 'Card');
  return (
    <article
      className={`${styles.tile} ${styles[`tone-${tone}`]} ${styles[`pattern-${pattern}`]} ${paid ? styles.paid : ''}`}
      aria-label={`${name || 'New card'} ending ${digits}, ${paid ? 'paid' : dueLabel}`}
    >
      <div className={styles.top}>
        <IssuerBadge issuer={badge} />
        <h2 className={styles.name}>{name || 'Your card'}</h2>
        {editHref && (
          <Link href={editHref} className={styles.edit} aria-label={`Edit ${name}`}>
            <Pencil />
          </Link>
        )}
      </div>
      <div className={styles.middle}>
        <CardChip className={styles.chip} />
        <span className={styles.digits}>•••• {digits}</span>
      </div>
      <div className={focus ? styles.dueFocus : styles.due}>{paid ? 'Paid' : dueLabel}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}

export { styles as cardTileStyles };
