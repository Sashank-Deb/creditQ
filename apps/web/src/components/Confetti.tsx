'use client';

import type { CSSProperties } from 'react';
import styles from './Confetti.module.scss';

const COLOURS = ['#e58f68', '#2f5444', '#b0532d', '#c8b27a', '#6b7f3a', '#8da4ff'];
const PIECES = 36;

/** A short burst of paper pieces from the bottom of the screen. Remove it after ~1.6s. */
export default function Confetti() {
  // Spread with golden-ratio fractions: varied-looking, but the same every render.
  const pieces = Array.from({ length: PIECES }, (_, i) => {
    const f = (k: number) => (i * k) % 1;
    return {
      id: i,
      colour: COLOURS[i % COLOURS.length],
      dx: Math.round((f(0.618034) - 0.5) * 320),
      rise: 180 + Math.round(f(0.754878) * 260),
      spin: Math.round((f(0.56984) - 0.5) * 900),
      delay: Math.round(f(0.430159) * 120),
      round: i % 4 === 0,
    };
  });
  return (
    <div className={styles.layer} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`${styles.piece} ${p.round ? styles.round : ''}`}
          style={
            {
              '--c': p.colour,
              '--dx': `${p.dx}px`,
              '--rise': `${p.rise}px`,
              '--spin': `${p.spin}deg`,
              animationDelay: `${p.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
