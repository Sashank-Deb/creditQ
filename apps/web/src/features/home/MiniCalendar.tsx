import { formatShortDate, monthGrid } from '@creditq/core';
import type { CalendarView } from './home-view';
import styles from './MiniCalendar.module.scss';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Read-only month view: the pay day filled, due dates ringed, today underlined. */
export default function MiniCalendar({ calendar }: { calendar: CalendarView }) {
  const pay = new Set(calendar.payDays);
  const summary = calendar.payDays.map((d) => `Pay day ${formatShortDate(d)}`).join('. ');

  return (
    <figure
      className={styles.calendar}
      aria-label={`${calendar.title}. ${summary || 'No pay day this month.'}`}
    >
      <figcaption className={styles.title}>{calendar.title}</figcaption>
      <div className={styles.grid} aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          // eslint-disable-next-line react/no-array-index-key -- weekday initials repeat (T, S)
          <span key={`${w}${i}`} className={styles.weekday}>
            {w}
          </span>
        ))}
        {monthGrid(calendar.month)
          .flat()
          .map((d, i) => {
            if (!d) {
              // eslint-disable-next-line react/no-array-index-key -- blank cells have no identity
              return <span key={`blank-${i}`} />;
            }
            const classes = [
              styles.day,
              pay.has(d) ? styles.pay : '',
              d === calendar.today ? styles.today : '',
            ].join(' ');
            return (
              <span key={d} className={classes}>
                {Number(d.slice(8, 10))}
              </span>
            );
          })}
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span>
          <i className={styles.todayDot} /> Today
        </span>
        <span>
          <i className={styles.payDot} /> Pay day
        </span>
      </div>
    </figure>
  );
}
