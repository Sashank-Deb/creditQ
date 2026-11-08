import Link from 'next/link';
import JsonLd from '../blog/JsonLd';
import { POSTS } from '../blog/posts';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import ui from '../components/ui.module.scss';
import { APP_URL, REPO_URL, SITE_NAME, SITE_URL } from '../site-config';
import Bento from './Bento';
import styles from './home.module.scss';
import PayDayTimeline from './PayDayTimeline';
import PhoneMockup from './PhoneMockup';
import Playground from './Playground';

const PAIN = [
  {
    title: 'Every card keeps its own calendar',
    text: 'Different statement dates, different due dates, a different app for each. Nothing lines up.',
  },
  {
    title: 'The due date is the wrong target',
    text: 'Pay on the due date itself and a weekend, a bank holiday or a slow channel can make it post late.',
  },
  {
    title: 'One SMS is easy to lose',
    text: 'A single alert gets buried under everything else. You need a plan, not a nudge.',
  },
];

const STEPS = [
  {
    title: 'Start from the earliest due date',
    text: 'In a group of cards, the one due first decides the pay day.',
  },
  {
    title: 'Step back by your lead time',
    text: 'You choose 1 to 10 days early (5 by default). Due on the 24th with 5 days lead means the 19th.',
  },
  {
    title: 'Roll off weekends and holidays',
    text: 'If that date is a Saturday, Sunday or bank holiday, the pay day moves earlier, never later.',
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

const STORED = [
  'Bank and card name',
  'Last 4 digits only',
  'Statement and due dates',
  'Amounts you choose to log',
  'Your settings, like lead days and theme',
];

const NEVER = [
  'Full card numbers',
  'CVV or PIN',
  'Passwords or bank logins',
  'Your emails, SMS or statements',
  'Your money. There is no autopay.',
];

const OFFLINE_POINTS = [
  {
    title: 'First visit',
    text: 'The app saves its own files on your device. This is the only time it needs a connection to work.',
  },
  {
    title: 'After that',
    text: 'Open it in airplane mode. Pay days, the calendar and your cards all work, because they are worked out on the device.',
  },
  {
    title: 'Updates',
    text: 'When you are online, the newest version is fetched quietly in the background and used next time you open the app.',
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
      <SiteHeader />

      <main id="top">
        <section className={styles.hero}>
          <div className={`${ui.wrap} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.pill}>
                <span /> Credit Queue · free, private, offline
              </p>
              <h1>
                Never miss a credit card bill. <em>Pay them all on one day.</em>
              </h1>
              <p className={styles.lead}>
                CreditQ is a calm reminder app for people with more than one card. Add each card
                once. It works out the single best day to pay, reminds you, and keeps everything
                encrypted on your phone.
              </p>
              <div className={styles.cta}>
                <a href={APP_URL} className={`${ui.btn} ${ui.primary}`}>
                  Open CreditQ
                </a>
                <a href="#playground" className={`${ui.btn} ${ui.ghost}`}>
                  Try the pay day calculator
                </a>
              </div>
              <ul className={styles.trust} aria-label="Highlights">
                <li>No account</li>
                <li>No server copy of your data</li>
                <li>No trackers</li>
                <li>
                  <a href={REPO_URL}>Open source</a>
                </li>
              </ul>
            </div>
            <PhoneMockup />
          </div>
        </section>

        <section className={`${ui.section} ${styles.why}`} aria-labelledby="why">
          <div className={ui.wrap}>
            <div className={styles.whyGrid}>
              <div>
                <p className={ui.eyebrow}>Why CreditQ</p>
                <h2 id="why" className={styles.big}>
                  Bills do not slip because you forgot. They slip because the dates never line up.
                </h2>
              </div>
              <ul className={styles.pains}>
                {PAIN.map((p) => (
                  <li key={p.title}>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pay-day" className={ui.section} aria-labelledby="pay-day-h">
          <div className={ui.wrap}>
            <div className={ui.head}>
              <p className={ui.eyebrow}>How pay day works</p>
              <h2 id="pay-day-h">One rule set, so you can predict the date.</h2>
              <p>
                Pay day is the day CreditQ asks you to pay. It is worked out the same way every
                time, on your device.
              </p>
            </div>
            <PayDayTimeline />
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span>{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <p className={styles.note}>
              <strong>Reminders:</strong> CreditQ nudges you on the pay day, and again on a due date
              if a bill is still open. Both appear as notifications where your device allows, and
              the calendar export adds the pay day to your calendar as a full-day event.
            </p>
          </div>
        </section>

        <section id="features" className={`${ui.section} ${styles.tinted}`} aria-labelledby="feat">
          <div className={ui.wrap}>
            <div className={ui.head}>
              <p className={ui.eyebrow}>Features</p>
              <h2 id="feat">Everything for paying on time, nothing else.</h2>
              <p>CreditQ does one job: making sure a bill never slips past you.</p>
            </div>
            <Bento />
          </div>
        </section>

        <section id="playground" className={ui.section} aria-labelledby="pg">
          <div className={ui.wrap}>
            <div className={ui.head}>
              <p className={ui.eyebrow}>Playground</p>
              <h2 id="pg">Try pay day yourself.</h2>
              <p>
                This runs the same planning code as the app, right in your browser. Change a date or
                the lead time and watch the pay day move.
              </p>
            </div>
            <Playground />
          </div>
        </section>

        <section id="offline" className={styles.dark} aria-labelledby="off">
          <div className={ui.wrap}>
            <div className={styles.darkGrid}>
              <div>
                <p className={`${ui.eyebrow} ${styles.onDark}`}>Offline first</p>
                <h2 id="off">Your bills should not depend on Wi-Fi.</h2>
                <p className={styles.darkLead}>
                  CreditQ keeps its own files and your data on the device, so the network is
                  optional.
                </p>
                <ul className={styles.points}>
                  {OFFLINE_POINTS.map((p) => (
                    <li key={p.title}>
                      <h3>{p.title}</h3>
                      <p>{p.text}</p>
                    </li>
                  ))}
                </ul>
                <p className={styles.honest}>
                  <strong>The honest limit:</strong> a web app cannot reliably wake up while closed,
                  and on iPhone notifications only work once it is added to the Home Screen. For
                  rock-solid reminders, export the pay days to your calendar once.
                </p>
              </div>
              <div className={styles.diagram}>
                <svg viewBox="0 0 520 380" role="img" aria-labelledby="off-t off-d">
                  <title id="off-t">Where CreditQ keeps things</title>
                  <desc id="off-d">
                    Your phone holds the app files and an encrypted database. The line to the
                    internet is cut: there is no server holding a copy of your data.
                  </desc>
                  <rect x="20" y="20" width="270" height="340" rx="38" className={styles.dPhone} />
                  <rect x="44" y="60" width="222" height="86" rx="16" className={styles.dBox} />
                  <text x="62" y="96" className={styles.dTitle}>
                    App files
                  </text>
                  <text x="62" y="120" className={styles.dText}>
                    Saved by a service worker
                  </text>
                  <rect x="44" y="164" width="222" height="86" rx="16" className={styles.dBoxHot} />
                  <text x="62" y="200" className={styles.dTitle}>
                    Encrypted database
                  </text>
                  <text x="62" y="224" className={styles.dText}>
                    AES-256-GCM in IndexedDB
                  </text>
                  <rect x="44" y="268" width="222" height="64" rx="16" className={styles.dBox} />
                  <text x="62" y="306" className={styles.dTitle}>
                    Pay days, computed here
                  </text>
                  <path d="M296 190 H400" className={styles.dCut} />
                  <circle cx="348" cy="190" r="18" className={styles.dX} />
                  <path d="M341 183 l14 14 M355 183 l-14 14" className={styles.dXLine} />
                  <rect
                    x="400"
                    y="130"
                    width="100"
                    height="120"
                    rx="20"
                    className={styles.dCloud}
                  />
                  <text x="450" y="182" textAnchor="middle" className={styles.dText}>
                    No server
                  </text>
                  <text x="450" y="202" textAnchor="middle" className={styles.dText}>
                    copy of
                  </text>
                  <text x="450" y="222" textAnchor="middle" className={styles.dText}>
                    your data
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section id="privacy" className={ui.section} aria-labelledby="priv">
          <div className={ui.wrap}>
            <div className={ui.head}>
              <p className={ui.eyebrow}>Private by design</p>
              <h2 id="priv">We cannot see your cards, because we never receive them.</h2>
              <p>
                There is no account and no database of ours. Your data is encrypted with AES-256-GCM
                in your browser&apos;s IndexedDB and never leaves the device.
              </p>
            </div>
            <div className={styles.privGrid}>
              <div className={styles.privCard}>
                <h3>What is stored, and only on your device</h3>
                <ul className={styles.tick}>
                  {STORED.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.privCard}>
                <h3>What CreditQ never asks for</h3>
                <ul className={styles.cross}>
                  {NEVER.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <ul className={styles.facts}>
              <li>
                <b>No tracking</b>
                <span>
                  No analytics, ads or third-party scripts. Fonts are bundled, not fetched.
                </span>
              </li>
              <li>
                <b>Backups you control</b>
                <span>Export and import with a passphrase (PBKDF2 and AES-GCM).</span>
              </li>
              <li>
                <b>Open source</b>
                <span>
                  Read every line on <a href={REPO_URL}>GitHub</a>.
                </span>
              </li>
            </ul>
            <p className={styles.note}>
              Read the full <a href={`${APP_URL}/privacy`}>privacy policy</a> and{' '}
              <a href={`${APP_URL}/terms`}>terms</a>.
            </p>
          </div>
        </section>

        <section
          id="guides"
          className={`${ui.section} ${styles.tinted}`}
          aria-labelledby="guides-h"
        >
          <div className={ui.wrap}>
            <div className={ui.head}>
              <p className={ui.eyebrow}>Guides</p>
              <h2 id="guides-h">Credit card guides for India.</h2>
              <p>Short reads on due dates, billing cycles and paying on time.</p>
            </div>
            <ul className={styles.guides}>
              {POSTS.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`}>
                    <span className={styles.meta}>{p.readMinutes} min read</span>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                    <span className={styles.more}>Read the guide</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className={ui.section} aria-labelledby="faq-h">
          <div className={`${ui.wrap} ${styles.faqGrid}`}>
            <div className={ui.head}>
              <p className={ui.eyebrow}>FAQ</p>
              <h2 id="faq-h">Questions, answered plainly.</h2>
            </div>
            <div className={styles.faq}>
              {FAQ.map((f) => (
                <details key={f.q} name="faq">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.final} aria-labelledby="final">
          <div className={ui.wrap}>
            <div className={styles.finalBox}>
              <h2 id="final">Add your first card in under a minute.</h2>
              <p>Add it to your Home Screen to use it like an app. Free, with no account.</p>
              <a href={APP_URL} className={`${ui.btn} ${ui.accent}`}>
                Open CreditQ
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
