/** The CreditQ mark as inline SVG: green tile, terracotta card, check badge. */
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="90 90 844 844" aria-hidden="true" focusable="false">
      <rect x="90" y="90" width="844" height="844" rx="220" fill="#1b3a30" />
      <rect
        x="235"
        y="325"
        width="554"
        height="365"
        rx="58"
        fill="#b0532d"
        stroke="#d17a4d"
        strokeWidth="8"
      />
      <rect x="290" y="398" width="112" height="76" rx="18" fill="#f1e2c2" />
      <rect x="290" y="570" width="275" height="38" rx="19" fill="#f5e9d4" />
      <circle cx="730" cy="286" r="82" fill="#f7f7f1" stroke="#d9e3dc" strokeWidth="8" />
      <path
        d="M690 286 L718 315 L772 254"
        fill="none"
        stroke="#183c30"
        strokeWidth="25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
