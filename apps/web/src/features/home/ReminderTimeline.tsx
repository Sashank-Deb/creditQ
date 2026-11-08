import type { TimelineItem } from './home-view';
import styles from './ReminderTimeline.module.scss';

interface ReminderTimelineProps {
  items: readonly TimelineItem[];
  /** e.g. "9:00 am" */
  time: string;
}

/** The reminder status as a vertical timeline: today, then what is coming up. */
export default function ReminderTimeline({ items, time }: ReminderTimelineProps) {
  const upcoming = items.filter((i) => i.kind !== 'today');
  return (
    <section className={styles.timeline} aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className={styles.heading}>
        Reminders on
        <span className={styles.time}>{time}</span>
      </h2>
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={`${item.kind}-${item.date}`} className={`${styles.item} ${styles[item.kind]}`}>
            {item.kind === 'missed' ? (
              <svg
                className={styles.alert}
                viewBox="0 0 24 24"
                width="20"
                height="20"
                role="img"
                aria-label="Missed"
              >
                <circle cx="12" cy="12" r="11" fill="currentColor" />
                <path
                  d="M12 6.5v7M12 16.6v.4"
                  stroke="var(--bg-primary)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            ) : (
              <span className={styles.dot} aria-hidden="true" />
            )}
            <span className={styles.label}>{item.label}</span>
            <span className={styles.detail}>{item.detail}</span>
          </li>
        ))}
      </ol>
      {upcoming.length === 0 && <p className={styles.empty}>Nothing coming up.</p>}
    </section>
  );
}
