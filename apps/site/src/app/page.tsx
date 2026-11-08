import Link from 'next/link';
import JsonLd from '../blog/JsonLd';
import { POSTS } from '../blog/posts';
import { APP_URL, REPO_URL, SITE_NAME, SITE_URL } from '../site-config';
import Playground from './Playground';
import styles from './site.module.scss';

const FEATURES = [
  {
    title: 'One pay day, not five',
    text: 'Cards due close together share a single pay day. You sit down once and pay them all.',
  },
  {
    title: 'Reminders that respect your week',
    text: 'The pay day is set a few days before the earliest due date and always lands on a working bank day.',
  },
  {
    title: 'No amount up front',
    text: 'You only type an amount, if you want to, when you mark a bill paid. Skipping is fine.',
  },
  {
    title: 'Card deck home screen',
    text: 'Bills to pay this week stand out. Everything else is stacked in tidy decks: recently added, paid, and bill generated.',
  },
  {
    title: 'Calendar export',
    text: 'One full-day event per pay day, listing each card and its due date. Your calendar reminds you even when the app is closed.',
  },
  {
    title: 'Spends at a glance',
    text: 'See what you paid each month, in total or per card, from the amounts you chose to log.',
  },
  {
    title: 'Encrypted backup',
    text: 'Export everything to one file locked with your passphrase. Import it on a new phone.',
  },
  {
    title: 'Light, dark, or your device',
    text: 'Pick a theme, or let it follow your phone. Colours and patterns for every card.',
  },
];

const STEPS = [
  {
    title: 'Start from the earliest due date',
    text: 'In a group of cards, the one due first decides the pay day.',
  },
  {
    title: 'Step back by your lead time',
    text: 'You choose how many days early (5 by default). Due on the 24th with 5 days lead means the 19th.',
  },
  {
    title: 'Roll off weekends and holidays',
    text: 'Banks need working days to post a payment. If that date is a Saturday, Sunday or bank holiday, the pay day moves earlier, never later.',
  },
  {
    title: 'Never before the bill exists',
    text: 'A pay day is never earlier than the day your statement is generated.',
  },
  {
    title: 'Group what is close',
    text: 'Bills due within 7 days of each other share the same pay day.',
  },
];

const FAQ = [
  {
    q: 'Does it need the internet?',
    a: 'Only to load the first time and to pick up new versions. After that the app opens, shows your cards and works out your pay days with no connection at all.',
  },
  {
    q: 'Where is my data?',
    a: 'On your device, in your browser storage, encrypted. There is no account and no CreditQ server that holds your cards or bills.',
  },
  {
    q: 'Will it pay my bills for me?',
    a: 'No, on purpose. CreditQ never touches your money and never asks for card numbers, CVVs or bank logins. It reminds you; you pay in your own bank app.',
  },
  {
    q: 'Do notifications work on iPhone?',
    a: 'On iPhone, notifications only work for apps added to the Home Screen, and a web app cannot wake itself up on a schedule. That is why the calendar export exists: your calendar does the reminding, reliably.',
  },
  {
    q: 'What happens if I clear my browser data or change phones?',
    a: 'Cleared data is gone, because there is no server copy. Export a backup from Settings and import it on the new device.',
  },
  {
    q: 'What does it cost?',
    a: 'Nothing. It runs on free static hosting and has no running costs that need your data.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: SITE_NAME,
              url: APP_URL,
              description:
                'Credit card bill reminders with a single pay day for all your cards. Works offline; data stays on your device.',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any (web, installable)',
              browserRequirements: 'Requires a modern browser',
              inLanguage: 'en-IN',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
              image: `${SITE_URL}/icon-512.png`,
            },
            {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/icon-512.png`,
              sameAs: [REPO_URL],
            },
            {
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
            },
            {
              '@type': 'FAQPage',
              mainEntity: FAQ.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ],
        }}
      />
      <header className={styles.nav}>
        <a href="#top" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          CreditQ
        </a>
        <nav aria-label="Sections" className={styles.links}>
          <a href="#features">Features</a>
          <a href="#pay-day">Pay day</a>
          <a href="#playground">Try it</a>
          <a href="#offline">Offline</a>
          <a href="#faq">FAQ</a>
          <Link href="/blog">Blog</Link>
        </nav>
        <a href={APP_URL} className={styles.btnPrimarySmall}>
          Open app
        </a>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <p className={styles.kicker}>Credit Queue</p>
          <h1>Never miss a credit card bill. Pay them all on one day.</h1>
          <p className={styles.lead}>
            CreditQ is a calm reminder app for people with more than one card. Add a card once. It
            tells you the single best day to pay, works without internet, and keeps everything on
            your phone.
          </p>
          <div className={styles.cta}>
            <a href={APP_URL} className={styles.btnPrimary}>
              Open CreditQ
            </a>
            <a href="#playground" className={styles.btnGhost}>
              Try the pay day calculator
            </a>
          </div>
          <ul className={styles.badges} aria-label="Highlights">
            <li>No account</li>
            <li>Works offline</li>
            <li>Encrypted on device</li>
            <li>Free</li>
          </ul>
          <div className={styles.deckArt} aria-hidden="true">
            <span className={styles.art1}>HDFC Regalia · pay Thu 19 Nov</span>
            <span className={styles.art2}>Axis Flipkart</span>
            <span className={styles.art3}>SBI Cashback</span>
          </div>
        </section>

        <section id="features" className={styles.section}>
          <h2>Everything for paying on time, nothing else</h2>
          <p className={styles.sub}>
            CreditQ is focused on one job: making sure a bill never slips past you.
          </p>
          <ul className={styles.grid}>
            {FEATURES.map((f) => (
              <li key={f.title} className={styles.card}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="pay-day" className={styles.section}>
          <h2>How pay day works</h2>
          <p className={styles.sub}>
            Pay day is the day CreditQ asks you to pay. It is worked out the same way every time, so
            you can predict it.
          </p>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepNo}>{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles.example}>
            <h3>A worked example</h3>
            <p>
              Two cards: one due <strong>Sun, 6 Dec</strong>, another due{' '}
              <strong>Tue, 8 Dec</strong>. They are two days apart, so they share a pay day. The
              earliest due date is the 6th; five days earlier is Tue 1 Dec, a normal working day. So
              your pay day is <strong>Tue, 1 Dec</strong>, and both cards are paid together.
            </p>
          </div>
          <p className={styles.note}>
            Reminders: CreditQ nudges you on the pay day, and again on a due date if a bill is still
            open. Both appear as notifications where your device allows, and the calendar export
            adds the pay day to your calendar as a full-day event.
          </p>
        </section>

        <section id="playground" className={styles.section}>
          <h2>Playground: try pay day yourself</h2>
          <p className={styles.sub}>
            This runs the same planning code as the app, right in your browser. Change a date or the
            lead time and watch the pay day move.
          </p>
          <Playground />
        </section>

        <section id="offline" className={styles.section}>
          <h2>Offline first, on purpose</h2>
          <p className={styles.sub}>
            Your bills should not depend on Wi-Fi. CreditQ is built so the network is optional.
          </p>
          <div className={styles.offline}>
            <svg viewBox="0 0 640 260" role="img" aria-labelledby="offline-title offline-desc">
              <title id="offline-title">Where CreditQ keeps things</title>
              <desc id="offline-desc">
                Your phone holds the app files and an encrypted database. There is no line to a
                server holding your data.
              </desc>
              <rect x="40" y="20" width="360" height="220" rx="28" className={styles.svgPhone} />
              <rect x="64" y="52" width="312" height="72" rx="14" className={styles.svgBox} />
              <text x="84" y="82" className={styles.svgTitle}>
                App files
              </text>
              <text x="84" y="104" className={styles.svgText}>
                Saved by the service worker
              </text>
              <rect
                x="64"
                y="140"
                width="312"
                height="72"
                rx="14"
                className={styles.svgBoxAccent}
              />
              <text x="84" y="170" className={styles.svgTitle}>
                Encrypted database
              </text>
              <text x="84" y="192" className={styles.svgText}>
                Cards, bills, payments (AES-256)
              </text>
              <path d="M410 130h110" className={styles.svgCut} />
              <path d="M450 112l30 36M480 112l-30 36" className={styles.svgCross} />
              <g transform="translate(520 70)">
                <rect width="100" height="120" rx="16" className={styles.svgServer} />
                <text x="50" y="62" textAnchor="middle" className={styles.svgText}>
                  No server
                </text>
                <text x="50" y="82" textAnchor="middle" className={styles.svgText}>
                  copy of your
                </text>
                <text x="50" y="102" textAnchor="middle" className={styles.svgText}>
                  data
                </text>
              </g>
            </svg>
            <ul className={styles.checks}>
              <li>
                <strong>First visit:</strong> the app saves its own files on your device. That is
                the only time it needs a connection to work.
              </li>
              <li>
                <strong>After that:</strong> open it in airplane mode. Pay days, the calendar and
                your cards all work, because they are worked out on the device.
              </li>
              <li>
                <strong>Your data:</strong> stored encrypted in the browser&apos;s IndexedDB.
                Nothing syncs, so nothing needs to.
              </li>
              <li>
                <strong>Updates:</strong> when you are online, the newest version is fetched quietly
                in the background and used next time you open the app.
              </li>
              <li>
                <strong>The honest limit:</strong> a web app cannot always wake up while closed,
                especially on iPhone. For that, export the pay days to your calendar once.
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Private by design</h2>
          <ul className={styles.grid}>
            <li className={styles.card}>
              <h3>We cannot see your cards</h3>
              <p>
                There is no account and no database of ours. Your data never leaves your device.
              </p>
            </li>
            <li className={styles.card}>
              <h3>Only the last 4 digits</h3>
              <p>No full card numbers, no CVV, no PIN, no bank login. Ever.</p>
            </li>
            <li className={styles.card}>
              <h3>No tracking</h3>
              <p>No analytics, ads or third-party scripts. Fonts are bundled, not fetched.</p>
            </li>
          </ul>
          <p className={styles.note}>
            Read the full <a href={`${APP_URL}/privacy`}>privacy policy</a> and{' '}
            <a href={`${APP_URL}/terms`}>terms</a>. The code is on <a href={REPO_URL}>GitHub</a>.
          </p>
        </section>

        <section id="faq" className={styles.section}>
          <h2>Questions</h2>
          <div className={styles.faq}>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="guides">
          <h2 id="guides">Credit card guides</h2>
          <p className={styles.sub}>Short reads on due dates, billing cycles and paying on time.</p>
          <ul className={styles.grid}>
            {POSTS.map((p) => (
              <li key={p.slug} className={styles.card}>
                <h3>
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </h3>
                <p>{p.excerpt}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.final}>
          <h2>Add your first card in under a minute</h2>
          <a href={APP_URL} className={styles.btnPrimary}>
            Open CreditQ
          </a>
          <p>Add it to your Home Screen to use it like an app.</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 CreditQ. Made in India. Not affiliated with any bank.</p>
        <p>
          <Link href="/blog">Blog</Link> · <a href={`${APP_URL}/privacy`}>Privacy</a> ·{' '}
          <a href={`${APP_URL}/terms`}>Terms</a> · <a href={REPO_URL}>GitHub</a>
        </p>
      </footer>
    </>
  );
}
