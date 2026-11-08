import { useId } from 'react';

/**
 * A card's EMV chip: brushed-gold metal, the classic contact-pad layout, and a soft highlight
 * so it catches the light. Purely decorative.
 */
export default function CardChip({ className = undefined }: { className?: string }) {
  const id = useId();
  const metal = `${id}-metal`;
  const shine = `${id}-shine`;
  return (
    <svg
      className={className}
      viewBox="0 0 52 40"
      width="52"
      height="40"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e6ac" />
          <stop offset="0.45" stopColor="#d9b95f" />
          <stop offset="0.7" stopColor="#e9d38d" />
          <stop offset="1" stopColor="#b8913d" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="51" height="39" rx="7" fill={`url(#${metal})`} />
      <rect x="0.5" y="0.5" width="51" height="39" rx="7" fill={`url(#${shine})`} />
      <g fill="none" stroke="#6b4e12" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round">
        <rect x="17" y="11" width="18" height="18" rx="4.5" />
        <path d="M1 14h16M1 26h16M35 14h16M35 26h16M26 1v10M26 29v10M1 20h16M35 20h16" />
      </g>
      <rect
        x="0.5"
        y="0.5"
        width="51"
        height="39"
        rx="7"
        fill="none"
        stroke="#6b4e12"
        strokeOpacity="0.45"
      />
    </svg>
  );
}
