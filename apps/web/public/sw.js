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

// ---- Offline shell: the app opens with no network once it has been loaded once. ----
// Only the app's own files (pages, scripts, styles, fonts, icons) are cached. Nothing the
// user entered is ever here: that lives encrypted in IndexedDB.
const SHELL = 'creditq-shell-v1';

const putIfOk = async (cache, request, response) => {
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
};

// Fetch the given pages and the scripts/styles they point at, so every screen works offline.
const warm = async (urls) => {
  const cache = await caches.open(SHELL);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url);
        // A redirected response cannot answer a navigation, so only keep direct ones.
        if (!res.ok || res.redirected) return;
        const html = await res.clone().text();
        await cache.put(url, res);
        const assets = new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) || []);
        await Promise.all(
          [...assets].map(async (asset) => {
            if (await cache.match(asset)) return;
            const r = await fetch(asset);
            await putIfOk(cache, asset, r);
          }),
        );
      } catch {
        // Offline or blocked: try again on the next visit.
      }
    }),
  );
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(tick),
  );
});

// Stale-while-revalidate: answer from the cache at once, refresh it in the background.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/site')
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL);
      const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      const network = fetch(req)
        .then((res) => putIfOk(cache, req, res))
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      return (await network) || Response.error();
    })(),
  );
});
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'creditq-reminders') event.waitUntil(tick());
});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'tick') event.waitUntil(tick());
  if (event.data && event.data.type === 'warm') event.waitUntil(warm(event.data.urls));
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
