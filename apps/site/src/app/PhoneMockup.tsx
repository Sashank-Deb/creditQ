import styles from './phone.module.scss';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
/** Mon 23 Nov to Sun 13 Dec 2026. Today is Fri 27 Nov, the pay day is Tue 1 Dec. */
const DAYS = Array.from({ length: 21 }, (_, i) => {
  const n = 23 + i;
  return n > 30 ? n - 30 : n;
});

const dayClass = (i: number): string => {
  if (i === 4) return styles.today ?? '';
  if (i === 8) return styles.payday ?? '';
  if (i === 13 || i === 15) return styles.due ?? '';
  return '';
};

/** Decorative recreation of the app: calendar, card deck and the Mark as paid sheet. */
export default function PhoneMockup() {
  return (
    <div className={styles.stage}>
      <div
        className={styles.phone}
        role="img"
        aria-label="CreditQ home screen: a calendar with today in blue and the pay day in peach, a deck of cards, and the Mark as paid sheet with an optional amount."
      >
        <div className={styles.screen} aria-hidden="true">
          <div className={styles.island} />
          <div className={styles.bar}>
            <span>9:41</span>
            <span className={styles.battery} />
          </div>
          <div className={styles.appHead}>
            <b>Home</b>
            <span>Nov 2026</span>
          </div>

          <div className={styles.cal}>
            <div className={styles.week}>
              {WEEK.map((d, i) => (
                // eslint-disable-next-line react/no-array-index-key -- static decorative weekday row
                <span key={`${d}${i}`}>{d}</span>
              ))}
            </div>
            <div className={styles.days}>
              {DAYS.map((d, i) => (
                // eslint-disable-next-line react/no-array-index-key -- static decorative grid
                <span key={i} className={dayClass(i)}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.next}>
            <span className={styles.nextDot} />
            <div>
              <b>Tue 1 Dec · Pay day</b>
              <small>2 cards · in 4 days</small>
            </div>
          </div>

          <div className={styles.deck}>
            <div className={`${styles.card} ${styles.c3}`} />
            <div className={`${styles.card} ${styles.c2}`}>
              <i>S</i>
            </div>
            <div className={`${styles.card} ${styles.c1}`}>
              <i>F</i>
              <span>Everyday card</span>
              <em>•• 4821</em>
              <small>Due Sun 6 Dec</small>
            </div>
          </div>

          <div className={styles.scrim} />
          <div className={styles.sheet}>
            <span className={styles.grab} />
            <b>Mark as paid</b>
            <small>Everyday card •• 4821</small>
            <div className={styles.field}>
              <span>Amount (optional)</span>
              <em>₹ 12,480</em>
            </div>
            <div className={styles.row}>
              <span className={styles.skip}>Skip</span>
              <span className={styles.confirm}>Mark as paid</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.chip} ${styles.chipA}`} aria-hidden="true">
        <i /> Pay day · Tue 1 Dec
      </div>
      <div className={`${styles.chip} ${styles.chipB}`} aria-hidden="true">
        <i /> Encrypted on this device
      </div>
    </div>
  );
}
