/** The revert arrow, shared so every "revert payment" button looks the same. */
export default function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M9 7L4.5 11.5 9 16M5 11.5h9.5a5 5 0 010 10H11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
