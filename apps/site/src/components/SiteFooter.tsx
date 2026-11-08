import Link from 'next/link';
import { APP_URL, REPO_URL } from '../site-config';
import styles from './chrome.module.scss';
import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footInner}>
        <div className={styles.footBrand}>
          <Link href="/" className={styles.brand} aria-label="CreditQ home">
            <Logo size={30} />
            <span>CreditQ</span>
          </Link>
          <p>A private credit card bill reminder for India. Free, offline-first and open source.</p>
        </div>
        <nav aria-label="Product" className={styles.col}>
          <h2>Product</h2>
          <a href={APP_URL}>Open the app</a>
          <Link href="/#features">Features</Link>
          <Link href="/#playground">Pay day calculator</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <nav aria-label="Learn and trust" className={styles.col}>
          <h2>Learn and trust</h2>
          <Link href="/blog">Guides</Link>
          <a href={`${APP_URL}/privacy`}>Privacy policy</a>
          <a href={`${APP_URL}/terms`}>Terms</a>
          <a href={REPO_URL}>Source on GitHub</a>
        </nav>
      </div>
      <p className={styles.legal}>© 2026 CreditQ. Made in India. Not affiliated with any bank.</p>
    </footer>
  );
}
