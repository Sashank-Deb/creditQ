'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { openBackup } from '@creditq/vault';
import BackButton from '@/components/BackButton';
import { useVaultAction } from '@/lib/vault-client';
import styles from './BackupScreen.module.scss';

export default function ImportScreen() {
  const router = useRouter();
  const act = useVaultAction();
  const [file, setFile] = useState<File | null>(null);
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);

  // After a restore, show the success screen briefly, then go home.
  useEffect(() => {
    if (!restored) return undefined;
    const t = setTimeout(() => router.push('/'), 2200);
    return () => clearTimeout(t);
  }, [restored, router]);

  const submit = async () => {
    if (!file) {
      setError('Choose a backup file first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const snapshot = await openBackup(await file.text(), pass);
      await act((v) => v.importSnapshot(snapshot));
      setRestored(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (restored) {
    return (
      <main className={styles.screen}>
        <div className={styles.doneIcon} aria-hidden="true">
          ✓
        </div>
        <h1 className={styles.title}>Backup restored</h1>
        <p className={styles.lead} role="status">
          Your cards, bills and payments are back. Taking you home…
        </p>
        <div className={styles.dock}>
          <Link href="/" className={styles.btnPrimary}>
            Go to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <BackButton href="/settings" />
      </header>
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h1 className={styles.title}>Import your data</h1>
        <p className={styles.hint}>
          This replaces every card, bill and payment on this device with the ones in the file.
        </p>

        <span className={styles.label} id="import-file-label">
          Backup file
        </span>
        <input
          id="import-file"
          type="file"
          accept="application/json,.json"
          className={styles.fileInput}
          aria-labelledby="import-file-label"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the text is in nested spans */}
        <label htmlFor="import-file" className={styles.filePicker}>
          <span className={styles.fileIcon} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
            </svg>
          </span>
          <span className={styles.fileText}>
            <strong>{file ? file.name : 'Choose backup file'}</strong>
            <small>
              {file
                ? `${Math.max(1, Math.round(file.size / 1024))} KB · tap to change`
                : 'A creditq-backup .json file'}
            </small>
          </span>
        </label>

        <label className={styles.label} htmlFor="import-pass">
          Passphrase
        </label>
        <input
          id="import-pass"
          type="password"
          className={styles.input}
          autoComplete="off"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.dock}>
          <button type="submit" className={styles.btnPrimary} disabled={busy}>
            {busy ? 'Restoring…' : 'Replace my data'}
          </button>
        </div>
      </form>
    </main>
  );
}
