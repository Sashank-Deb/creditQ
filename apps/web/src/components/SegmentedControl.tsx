'use client';

import type { CSSProperties, ReactNode } from 'react';
import { haptic } from '@/lib/haptics';
import styles from './SegmentedControl.module.scss';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Extra class, e.g. to let it grow inside a row. */
  className?: string;
}

/** Tabs in a pill track. The selected pill slides to the chosen option instead of jumping. */
export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      className={`${styles.root} ${className}`}
      role="tablist"
      aria-label={label}
      style={{ '--count': options.length, '--index': index } as CSSProperties}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={`${styles.option} ${o.value === value ? styles.on : ''}`}
          onClick={() => {
            if (o.value !== value) haptic('tab');
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
