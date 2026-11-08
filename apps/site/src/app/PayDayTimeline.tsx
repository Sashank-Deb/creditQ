import styles from './timeline.module.scss';

/** Tue 1 Dec to Tue 8 Dec 2026: the worked example, drawn. */
const CELLS = [
  { dow: 'Tue', n: 1, kind: 'payday' },
  { dow: 'Wed', n: 2, kind: '' },
  { dow: 'Thu', n: 3, kind: '' },
  { dow: 'Fri', n: 4, kind: '' },
  { dow: 'Sat', n: 5, kind: 'weekend' },
  { dow: 'Sun', n: 6, kind: 'weekend due' },
  { dow: 'Mon', n: 7, kind: '' },
  { dow: 'Tue', n: 8, kind: 'due' },
];

const cellClass = (kind: string) =>
  kind
    .split(' ')
    .filter(Boolean)
    .map((k) => styles[k])
    .join(' ');

export default function PayDayTimeline() {
  return (
    <figure className={styles.figure}>
      <div className={styles.board}>
        <div className={styles.arcWrap} aria-hidden="true">
          <svg viewBox="0 0 800 80" preserveAspectRatio="none" className={styles.arc}>
            <path d="M550 78 C550 -6 50 -6 50 78" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className={styles.arcLabel}>5 days earlier</span>
        </div>
        <ol className={styles.cells}>
          {CELLS.map((c) => (
            <li key={c.n} className={cellClass(c.kind)}>
              <small>{c.dow}</small>
              <b>{c.n}</b>
              {c.kind.includes('due') && <i aria-hidden="true" />}
              {c.kind === 'payday' && <em>Pay</em>}
            </li>
          ))}
        </ol>
        <ul className={styles.legend}>
          <li>
            <span className={styles.kPay} /> Pay day
          </li>
          <li>
            <span className={styles.kDue} /> A card is due
          </li>
          <li>
            <span className={styles.kWeekend} /> Weekend
          </li>
        </ul>
      </div>
      <figcaption className={styles.caption}>
        Card A is due Sun 6 Dec and card B Tue 8 Dec. They are two days apart, so they share one pay
        day: five days before the earliest due date, Tue 1 Dec.
      </figcaption>
    </figure>
  );
}
