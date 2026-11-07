'use client';

import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import { istInstant, toIcs } from '@creditq/core';
import { buildReminderPlan } from '@/features/reminders/reminder-plan';
import { notificationsSupported } from '@/features/reminders/ReminderRuntime';
import { getVault, useTodayInIndia, useVaultAction, useVaultData } from '@/lib/vault-client';
import styles from './SettingsScreen.module.scss';

type Permission = 'unsupported' | NotificationPermission;

const readPermission = (): Permission =>
  notificationsSupported() ? Notification.permission : 'unsupported';

const DAY_MS = 86_400_000;

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

  if (!data || !today) return <main className={styles.screen} aria-busy="true" />;
  const { settings } = data;
  const plan = buildReminderPlan({ today, ...data });

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
    const ics = toIcs(plan, { dtstamp: istInstant(today, '00:00') });
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
        <Link href="/" className={styles.back}>
          Back
        </Link>
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
              {plan.length > 0
                ? `${plan.length} reminders. The most reliable way: your calendar reminds you even if this app is closed. Apple Calendar keeps our alerts; Google Calendar uses your default alert time.`
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
            disabled={plan.length === 0}
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
              Remind me {settings.leadDays} {settings.leadDays === 1 ? 'day' : 'days'} before
            </p>
            <p className={styles.rowHint}>Counted from the earliest due date in a group.</p>
          </div>
          <div className={styles.stepper} role="group" aria-labelledby="lead-label">
            <button
              type="button"
              aria-label="One day fewer"
              disabled={settings.leadDays <= 1}
              onClick={() => act((v) => v.saveSettings({ leadDays: settings.leadDays - 1 }))}
            >
              −
            </button>
            <span aria-live="polite">{settings.leadDays}</span>
            <button
              type="button"
              aria-label="One day more"
              disabled={settings.leadDays >= 10}
              onClick={() => act((v) => v.saveSettings({ leadDays: settings.leadDays + 1 }))}
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
              Off keeps names out of calendars that sync to the cloud. Amounts are never included.
            </span>
          </div>
          <input
            id="card-names"
            type="checkbox"
            role="switch"
            aria-describedby="card-names-hint"
            className={styles.switch}
            checked={settings.contentLevel === 'cards'}
            onChange={(e) => {
              // Read the new value now: React restores a controlled checkbox right after this
              // event, so reading it later inside the async save would see the old value.
              const contentLevel = e.target.checked ? 'cards' : 'minimal';
              act((v) => v.saveSettings({ contentLevel }));
            }}
          />
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
