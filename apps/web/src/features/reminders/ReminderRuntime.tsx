'use client';

import { useEffect } from 'react';
import { claimNotice, readOutbox, replaceOutbox } from '@/lib/outbox';
import { todayInIndia } from '@/lib/today';
import { useTodayInIndia, useVaultData } from '@/lib/vault-client';
import { buildReminderPlan, dueToShow, mergeOutbox } from './reminder-plan';

const TICK_MS = 60_000;

export const notificationsSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

/**
 * Page-side reminder scheduler (design doc 04, section 4.1). While the app is open it
 * keeps the outbox in step with the plan and shows due reminders every minute; the service
 * worker covers what it can when the app is closed. Renders nothing.
 */
export default function ReminderRuntime() {
  const today = useTodayInIndia();
  const { data } = useVaultData();

  // Register the worker once; it only ever reads the outbox.
  useEffect(() => {
    if (notificationsSupported()) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  // Re-plan whenever cards, bills or settings change.
  useEffect(() => {
    if (!today || !data) return;
    const plan = buildReminderPlan({ today, ...data });
    readOutbox()
      .then((existing) => replaceOutbox(mergeOutbox(existing, plan)))
      .catch(() => undefined);
  }, [today, data]);

  // Show due reminders now, every minute, and whenever the tab becomes visible.
  useEffect(() => {
    const tick = async () => {
      if (!notificationsSupported() || Notification.permission !== 'granted') return;
      const now = Date.now();
      const due = dueToShow(await readOutbox(), now, todayInIndia(new Date(now)));
      const reg = await navigator.serviceWorker.ready;
      await Promise.all(
        due.map(async (r) => {
          if (await claimNotice(r.itemId, now)) {
            await reg.showNotification(r.title, {
              body: r.body,
              tag: r.tag,
              icon: '/icon.svg',
              data: { url: '/' },
            });
          }
        }),
      );
    };
    const safeTick = () => {
      tick().catch(() => undefined);
    };
    safeTick();
    const timer = setInterval(safeTick, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') safeTick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
