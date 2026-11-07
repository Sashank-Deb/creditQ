/**
 * The notification outbox: a tiny IndexedDB store shared by the page and the service
 * worker (public/sw.js uses the same names). It holds only minimal reminder text and
 * dates, never names, digits or amounts, so the worker can read it without the vault key.
 */
import type { OutboxRow } from '@/features/reminders/reminder-plan';

export const OUTBOX_DB = 'creditq-outbox';
const STORE = 'notices';

const openOutbox = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(OUTBOX_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'itemId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const done = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.addEventListener('complete', () => resolve());
    tx.addEventListener('error', () => reject(tx.error));
    tx.addEventListener('abort', () => reject(tx.error));
  });

export const readOutbox = async (): Promise<OutboxRow[]> => {
  const db = await openOutbox();
  const rows = await new Promise<OutboxRow[]>((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OutboxRow[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => a.fireAt - b.fireAt);
};

export const replaceOutbox = async (rows: readonly OutboxRow[]): Promise<void> => {
  const db = await openOutbox();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  store.clear();
  rows.forEach((r) => store.put(r));
  await done(tx);
  db.close();
};

/** Compare-and-set inside one transaction, so a tab and the worker never both notify. */
export const claimNotice = async (itemId: string, at: number): Promise<boolean> => {
  const db = await openOutbox();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const claimed = await new Promise<boolean>((resolve) => {
    const req = store.get(itemId);
    req.onsuccess = () => {
      const row = req.result as OutboxRow | undefined;
      if (!row || row.shownAt !== null) {
        resolve(false);
        return;
      }
      store.put({ ...row, shownAt: at });
      resolve(true);
    };
    req.onerror = () => resolve(false);
  });
  await done(tx);
  db.close();
  return claimed;
};
