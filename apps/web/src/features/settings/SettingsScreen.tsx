'use client';

import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { istInstant, toPayDayIcs } from '@creditq/core';
import type { ContentLevel } from '@creditq/vault';
import { buildPayDayEvents } from '@/features/reminders/reminder-plan';
import { notificationsSupported } from '@/features/reminders/ReminderRuntime';
import { haptic } from '@/lib/haptics';
import { applyTheme, readTheme, saveTheme, THEMES, type Theme } from '@/lib/theme';
import { getVault, useTodayInIndia, useVaultAction, useVaultData } from '@/lib/vault-client';
import styles from './SettingsScreen.module.scss';

type Permission = 'unsupported' | NotificationPermission;

const readPermission = (): Permission =>
  notificationsSupported() ? Notification.permission : 'unsupported';

const DAY_MS = 86_400_000;

const THEME_LABELS: Record<Theme, string> = { system: 'Device', light: 'Light', dark: 'Dark' };

interface Draft {
  leadDays?: number;
  contentLevel?: ContentLevel;
  theme?: Theme;
}

interface PeriodicSyncRegistration extends ServiceWorkerRegistration {
  periodicSync?: { register(tag: string, options: { minInterval: number }): Promise<void> };
}

export default function SettingsScreen() {
  const today = useTodayInIndia();
  const { data } = useVaultData();
  const act = useVaultAction();
  // Permission can change outside the app; re-read it on each render.
  const initial = useSyncExternalStore<Permission>(
    () => () => {},
    readPermission,
    () => 'default',
  );
  const [permission, setPermission] = useState<Permission | null>(null);
  const [exported, setExported] = useState(false);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const current = permission ?? initial;
  const [draft, setDraft] = useState<Draft>({});
  const [saved, setSaved] = useState(false);
  const savedTheme = useSyncExternalStore<Theme>(
    () => () => {},
    readTheme,
    () => 'system',
  );

  // Preview a theme choice while it is unsaved; leaving the screen puts the saved one back.
  useEffect(() => {
    if (draft.theme) applyTheme(draft.theme);
    return () => applyTheme(readTheme());
  }, [draft.theme]);

  if (!data || !today) return <main className={styles.screen} aria-busy="true" />;
  const { settings } = data;
  const payDays = buildPayDayEvents({ today, ...data });
  const leadDays = draft.leadDays ?? settings.leadDays;
  const contentLevel = draft.contentLevel ?? settings.contentLevel;
  const theme = draft.theme ?? savedTheme;
  const dirty =
    leadDays !== settings.leadDays ||
    contentLevel !== settings.contentLevel ||
    theme !== savedTheme;
  const change = (patch: Draft) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const saveChanges = async () => {
    // At the tap, not after the save: iPhone only allows a haptic inside the tap itself.
    haptic('save');
    await act((v) => v.saveSettings({ leadDays, contentLevel }));
    saveTheme(theme);
    setDraft({});
    setSaved(true);
  };

  const enableNotifications = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') return;
    const reg = (await navigator.serviceWorker.ready) as PeriodicSyncRegistration;
    // Best effort: only installed Chrome/Edge PWAs support this, and timing is not guaranteed.
    await reg.periodicSync
      ?.register('creditq-reminders', { minInterval: DAY_MS / 2 })
      .catch(() => undefined);
    reg.active?.postMessage({ type: 'tick' });
  };

  const exportCalendar = () => {
    const ics = toPayDayIcs(payDays, {
      dtstamp: istInstant(today, '00:00'),
      time: settings.reminderTime,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creditq-reminders.ics';
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const deleteEverything = async () => {
    confirmRef.current?.close();
    await (await getVault()).deleteEverything();
    indexedDB.deleteDatabase('creditq-outbox');
    // A full reload, not client navigation: it drops the in-memory vault handle and keys too.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/');
  };

  return (
    <main className={styles.screen}>
      <header className={styles.topBar}>
        <BackButton href="/" />
      </header>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.group} aria-labelledby="reminders-heading">
        <h2 id="reminders-heading" className={styles.groupTitle}>
          Reminders
        </h2>

        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle}>Add to your calendar</p>
            <p className={styles.rowHint}>
              {payDays.length > 0
                ? `${payDays.length} pay ${payDays.length === 1 ? 'day' : 'days'}. Each is a full-day event listing the cards to pay and their due dates, so your calendar reminds you even if this app is closed. Due dates are not added as events.`
                : 'Add a card first, then export its reminders.'}
            </p>
            {exported && (
              <p className={styles.rowOk} role="status">
                Saved. Open the file to add the reminders. Export again after you add a card.
              </p>
            )}
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={exportCalendar}
            disabled={payDays.length === 0}
          >
            Export
          </button>
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle}>Notifications</p>
            <p className={styles.rowHint}>
              {current === 'granted' &&
                'On. Shown while the app or browser is running; installed apps may get them in the background too.'}
              {current === 'default' &&
                'A bonus on top of your calendar. Works best when installed.'}
              {current === 'denied' &&
                'Blocked in your browser settings. Use the calendar export instead.'}
              {current === 'unsupported' &&
                'Not available here. On iPhone, add this app to your Home Screen first, or use the calendar export.'}
            </p>
          </div>
          {current === 'default' && (
            <button type="button" className={styles.btnSecondary} onClick={enableNotifications}>
              Turn on
            </button>
          )}
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle} id="lead-label">
              Remind me {leadDays} {leadDays === 1 ? 'day' : 'days'} before
            </p>
            <p className={styles.rowHint}>Counted from the earliest due date in a group.</p>
          </div>
          <div className={styles.stepper} role="group" aria-labelledby="lead-label">
            <button
              type="button"
              aria-label="One day fewer"
              disabled={leadDays <= 1}
              onClick={() => change({ leadDays: leadDays - 1 })}
            >
              −
            </button>
            <span aria-live="polite">{leadDays}</span>
            <button
              type="button"
              aria-label="One day more"
              disabled={leadDays >= 10}
              onClick={() => change({ leadDays: leadDays + 1 })}
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label className={styles.rowTitle} htmlFor="card-names">
              Show card names in reminders
            </label>
            <span id="card-names-hint" className={styles.rowHint}>
              Off keeps names out of notifications. The calendar file always lists card names.
              Amounts are never included.
            </span>
          </div>
          <input
            id="card-names"
            type="checkbox"
            role="switch"
            aria-describedby="card-names-hint"
            className={styles.switch}
            checked={contentLevel === 'cards'}
            onChange={(e) => {
              change({ contentLevel: e.target.checked ? 'cards' : 'minimal' });
            }}
          />
        </div>
      </section>

      <section className={styles.group} aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className={styles.groupTitle}>
          Appearance
        </h2>
        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle} id="theme-label">
              Theme
            </p>
            <p className={styles.rowHint}>
              Device follows your phone&apos;s light or dark setting.
            </p>
          </div>
          <div className={styles.segmented} role="radiogroup" aria-labelledby="theme-label">
            {THEMES.map((t) => (
              <label key={t} className={styles.segment}>
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => change({ theme: t })}
                />
                <span>{THEME_LABELS[t]}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.group} aria-labelledby="backup-heading">
        <h2 id="backup-heading" className={styles.groupTitle}>
          Backup
        </h2>
        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle}>Export data</p>
            <p className={styles.rowHint}>
              A file with all your cards, bills and payments, locked with a passphrase you choose.
            </p>
          </div>
          <Link href="/settings/export" className={styles.btnSecondary}>
            Export
          </Link>
        </div>
        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle}>Import data</p>
            <p className={styles.rowHint}>
              Restore from a CreditQ backup file. This replaces what is on this device.
            </p>
          </div>
          <Link href="/settings/import" className={styles.btnSecondary}>
            Import
          </Link>
        </div>
      </section>

      <section className={styles.privacy} aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className={styles.groupTitle}>
          Your data stays on this device
        </h2>
        <p className={styles.rowHint}>
          Cards and payments are encrypted in this browser. No account, no server copy. Clearing
          your browser data removes them, and so does the button below.
        </p>
        <button
          type="button"
          className={styles.btnDanger}
          onClick={() => confirmRef.current?.showModal()}
        >
          Delete all data
        </button>
      </section>

      <div className={styles.saveBar}>
        <button type="button" className={styles.btnPrimary} disabled={!dirty} onClick={saveChanges}>
          Save changes
        </button>
        <p className={styles.saveHint} role="status">
          {dirty && 'You have unsaved changes.'}
          {!dirty && saved && 'Saved.'}
        </p>
      </div>

      <dialog ref={confirmRef} className={styles.confirm} aria-labelledby="confirm-title">
        <h2 id="confirm-title" className={styles.groupTitle}>
          Delete all data?
        </h2>
        <p className={styles.rowHint}>
          This removes every card, bill and payment from this device. It cannot be undone. Reminders
          already in your calendar stay there.
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.btnDanger} onClick={deleteEverything}>
            Delete everything
          </button>
          <button
            type="button"
            className={styles.btnText}
            onClick={() => confirmRef.current?.close()}
          >
            Cancel
          </button>
        </div>
      </dialog>
    </main>
  );
}
