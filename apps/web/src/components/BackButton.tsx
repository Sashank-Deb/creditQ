import Link from 'next/link';
import styles from './BackButton.module.scss';

interface BackButtonProps {
  label?: string;
  /** Navigate to this route... */
  href?: string;
  /** ...or run this instead (for in-page steps). */
  onClick?: () => void;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A visible pill-shaped back control: chevron plus label, 44px tall. */
export default function BackButton({
  label = 'Back',
  href = undefined,
  onClick = undefined,
}: BackButtonProps) {
  if (href) {
    return (
      <Link href={href} className={styles.back}>
        <Chevron />
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      <Chevron />
      {label}
    </button>
  );
}
