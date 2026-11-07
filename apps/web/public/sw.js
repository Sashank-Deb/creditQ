/* CreditQ service worker: best-effort reminders (design doc 04, layer 3).
 * Reads only the outbox (minimal text, no names, digits or amounts). Never touches the vault.
 * Fires on periodic sync (installed Chrome/Edge PWAs, not guaranteed), on activation, and
 * when a page asks for a tick. The calendar export is the reliable channel.
 */
const OUTBOX_DB = 'creditq-outbox';
const STORE = 'notices';
const IST_OFFSET_MS = 19800000;

const todayInIndia = (now) => new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);

const openOutbox = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(OUTBOX_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'itemId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// Claim every due notice in one transaction (compare-and-set on shownAt).
const claimDue = async (now) => {
  const db = await openOutbox();
  const today = todayInIndia(now);
  const claimed = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const out = [];
    const req = store.getAll();
    req.onsuccess = () => {
      req.result
        .filter((r) => r.date === today && r.fireAt <= now && r.shownAt === null)
        .forEach((r) => {
          store.put({ ...r, shownAt: now });
          out.push(r);
        });
    };
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return claimed;
};

const tick = async () => {
  if (Notification.permission !== 'granted') return;
  const due = await claimDue(Date.now());
  await Promise.all(
    due.map((r) =>
      self.registration.showNotification(r.title, {
        body: r.body,
        tag: r.tag,
        icon: '/icon.svg',
        badge: '/icon.svg',
        data: { url: '/' },
      }),
    ),
  );
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim().then(tick));
});
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'creditq-reminders') event.waitUntil(tick());
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'tick') event.waitUntil(tick());
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === self.location.origin);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
