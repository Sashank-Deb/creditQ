import type { ReactNode } from 'react';
import BackButton from '@/components/BackButton';
import styles from './LegalPage.module.scss';

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

/** Shared frame for the privacy policy and terms: back button, title, readable text column. */
export default function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <BackButton href="/" />
      </header>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.updated}>Last updated {updated}</p>
      <div className={styles.body}>{children}</div>
    </main>
  );
}
