'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sealBackup } from '@creditq/vault';
import BackButton from '@/components/BackButton';
import { passphraseStrength } from '@/lib/passphrase';
import { getVault, useTodayInIndia } from '@/lib/vault-client';
import styles from './BackupScreen.module.scss';

export default function ExportScreen() {
  const today = useTodayInIndia();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const strength = passphraseStrength(pass);

  const submit = async () => {
    if (strength.level === 0) {
      setError('Use a passphrase of at least 8 characters.');
      return;
    }
    if (pass !== confirm) {
      setError('The two passphrases do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const snapshot = await (await getVault()).exportSnapshot();
      const file = await sealBackup(snapshot, pass);
      const url = URL.createObjectURL(new Blob([file], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `creditq-backup-${today ?? 'data'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setPass('');
      setConfirm('');
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className={styles.screen}>
        <div className={styles.doneIcon} aria-hidden="true">
          ✓
        </div>
        <h1 className={styles.title}>Backup saved</h1>
        <p className={styles.lead}>
          Keep the passphrase safe. Without it the file cannot be opened, and we cannot recover it
          for you.
        </p>
        <div className={styles.dock}>
          <Link href="/settings" className={styles.btnPrimary}>
            Back to settings
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
        <h1 className={styles.title}>Export your data</h1>
        <p className={styles.hint}>
          Your cards, bills and payments go into one file, locked with a passphrase you choose.
          There is no way to recover the passphrase.
        </p>

        <label className={styles.label} htmlFor="export-pass">
          Passphrase
        </label>
        <div className={styles.passWrap}>
          <input
            id="export-pass"
            type={reveal ? 'text' : 'password'}
            className={styles.input}
            autoComplete="new-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            aria-describedby="export-strength"
          />
          <button
            type="button"
            className={styles.reveal}
            aria-pressed={reveal}
            onClick={() => setReveal((r) => !r)}
          >
            {reveal ? 'Hide' : 'Show'}
          </button>
        </div>
        {pass.length > 0 && (
          <div id="export-strength" className={styles.strength} data-level={strength.level}>
            <div className={styles.meter} aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={n <= strength.level ? styles.meterOn : undefined} />
              ))}
            </div>
            <p role="status">
              <strong>{strength.label}.</strong> {strength.tip}
            </p>
          </div>
        )}

        <label className={styles.label} htmlFor="export-confirm">
          Repeat passphrase
        </label>
        <input
          id="export-confirm"
          type={reveal ? 'text' : 'password'}
          className={styles.input}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm.length > 0 && (
          <p className={pass === confirm ? styles.match : styles.hint} role="status">
            {pass === confirm ? 'Passphrases match.' : 'Passphrases do not match yet.'}
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.dock}>
          <button type="submit" className={styles.btnPrimary} disabled={busy}>
            {busy ? 'Encrypting…' : 'Download backup'}
          </button>
        </div>
      </form>
    </main>
  );
}
