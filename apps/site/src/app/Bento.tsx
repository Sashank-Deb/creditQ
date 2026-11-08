import styles from './bento.module.scss';

const BARS = [38, 62, 46, 80, 54, 70];
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const TILES = ['forest', 'terracotta', 'sand', 'olive', 'slate', 'burgundy', 'black'] as const;

function Tile({
  className,
  title,
  text,
  children,
}: {
  className: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <li className={`${styles.tile} ${className}`}>
      <div className={styles.visual} aria-hidden="true">
        {children}
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </li>
  );
}

export default function Bento() {
  return (
    <ul className={styles.grid}>
      <Tile
        className={styles.wide}
        title="One pay day, not five"
        text="Cards due close together share a single pay day. You sit down once and pay them all."
      >
        <div className={styles.merge}>
          <div className={styles.pills}>
            <span>Card A · due 6 Dec</span>
            <span>Card B · due 8 Dec</span>
            <span>Card C · due 7 Dec</span>
          </div>
          <svg viewBox="0 0 80 100" className={styles.funnel} preserveAspectRatio="none">
            <path d="M0 16 C40 16 40 50 80 50 M0 50 H80 M0 84 C40 84 40 50 80 50" />
          </svg>
          <div className={styles.date}>
            <small>Pay day</small>
            <b>1</b>
            <span>Dec</span>
          </div>
        </div>
      </Tile>

      <Tile
        className={styles.narrow}
        title="Reminders that respect your week"
        text="The pay day lands on a working bank day, rolled earlier, never later."
      >
        <div className={styles.weekRow}>
          <span>Thu</span>
          <span>Fri</span>
          <span className={styles.off}>Sat</span>
          <span className={styles.off}>Sun</span>
          <span className={styles.pick}>Mon</span>
        </div>
        <p className={styles.caption}>Weekend skipped</p>
      </Tile>

      <Tile
        className={styles.third}
        title="No amount up front"
        text="Type an amount, if you want to, only when you tap Mark as paid. Skipping is fine."
      >
        <div className={styles.sheet}>
          <div>
            <small>Amount (optional)</small>
            <b>₹ 12,480</b>
          </div>
          <div className={styles.btns}>
            <span>Skip</span>
            <span className={styles.go}>Mark as paid</span>
          </div>
        </div>
      </Tile>

      <Tile
        className={styles.third}
        title="Card deck home screen"
        text="Bills to pay this week stand out. The rest stack in tidy decks: recently added, paid, and bill generated."
      >
        <div className={styles.stack}>
          <i className={styles.s3} />
          <i className={styles.s2} />
          <i className={styles.s1}>
            <b>F</b>
          </i>
        </div>
      </Tile>

      <Tile
        className={styles.third}
        title="Calendar export"
        text="One full-day event per pay day listing each card, its last 4 digits and due date. Never an amount."
      >
        <div className={styles.event}>
          <span className={styles.bar} />
          <div>
            <b>CreditQ pay day</b>
            <small>Everyday card •• 4821 · due Sun 6 Dec</small>
            <small>Second card •• 1093 · due Tue 8 Dec</small>
          </div>
        </div>
      </Tile>

      <Tile
        className={styles.narrow}
        title="Spends at a glance"
        text="Monthly totals for the last 6 months, for all cards or each card, from amounts you chose to log."
      >
        <div className={styles.bars}>
          {BARS.map((h, i) => (
            <span key={MONTHS[i]} style={{ height: `${h}%` }}>
              <small>{MONTHS[i]}</small>
            </span>
          ))}
        </div>
        <p className={styles.caption}>Illustration</p>
      </Tile>

      <Tile
        className={styles.wide}
        title="Encrypted backup"
        text="Export everything to one file locked with your passphrase (PBKDF2 and AES-GCM). Import it on a new phone."
      >
        <div className={styles.lockRow}>
          <div className={styles.file}>
            <svg viewBox="0 0 24 24" width="28" height="28">
              <rect x="5" y="10" width="14" height="10" rx="2.5" />
              <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
            </svg>
            <span>backup file</span>
          </div>
          <span className={styles.arrow} />
          <div className={styles.passphrase}>
            <small>Passphrase</small>
            <b>••••••••••</b>
          </div>
        </div>
      </Tile>

      <Tile
        className={styles.full}
        title="Light, dark, or your device"
        text="Pick a theme or let it follow your phone. Seven card colours and six patterns make each card yours."
      >
        <div className={styles.swatches}>
          {TILES.map((t, i) => (
            <span key={t} className={styles[`t${i + 1}`]} title={t} />
          ))}
        </div>
      </Tile>
    </ul>
  );
}
