import type { ReactNode } from 'react';
import type { TileTone } from '@creditq/vault';
import styles from './CardTile.module.scss';

interface CardTileProps {
  name: string;
  last4: string;
  tone: TileTone;
  dueLabel: string;
  focus?: boolean;
  paid?: boolean;
  actions?: ReactNode;
}

/** The card tile from design v5. Invented gradients only: no issuer logos or branding. */
export default function CardTile({
  name,
  last4,
  tone,
  dueLabel,
  focus = false,
  paid = false,
  actions = null,
}: CardTileProps) {
  const digits = last4.padEnd(4, '•');
  return (
    <article
      className={`${styles.tile} ${styles[`tone-${tone}`]} ${paid ? styles.paid : ''}`}
      aria-label={`${name || 'New card'} ending ${digits}, ${paid ? 'paid' : dueLabel}`}
    >
      <div className={styles.top}>
        <h2 className={styles.name}>{name || 'Your card'}</h2>
        <span className={styles.digits}>•••• {digits}</span>
      </div>
      <div className={styles.chip} aria-hidden="true" />
      <div className={focus ? styles.dueFocus : styles.due}>{paid ? 'Paid' : dueLabel}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}

export { styles as cardTileStyles };
