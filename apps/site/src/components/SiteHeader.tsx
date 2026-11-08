import Link from 'next/link';
import { APP_URL } from '../site-config';
import styles from './chrome.module.scss';
import Logo from './Logo';

const LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#pay-day', label: 'How it works' },
  { href: '/#playground', label: 'Try it' },
  { href: '/#offline', label: 'Offline' },
  { href: '/#privacy', label: 'Privacy' },
  { href: '/blog', label: 'Guides' },
];

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="CreditQ home">
          <Logo size={30} />
          <span>CreditQ</span>
        </Link>
        <nav aria-label="Sections" className={styles.desktopNav}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <a href={APP_URL} className={styles.open}>
            Open app
          </a>
          <details className={styles.menu}>
            <summary aria-label="Menu">
              <span className={styles.burger} aria-hidden="true" />
            </summary>
            <nav aria-label="Menu" className={styles.sheet}>
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
