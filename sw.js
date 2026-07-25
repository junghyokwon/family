/* 겸율휘연 가족 액티비티 - 서비스워커 (앱 설치 + 오프라인 셸 + 푸시 알림) */
const CACHE = 'family-app-v2';
const SHELL = ['./', './index.html', './icon-192.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{}); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

/* 푸시 수신 → 알림 표시 */
self.addEventListener('push', e => {
  let d = { title: '겸율휘연', body: '새 알림이 있어요', url: './' };
  try { if (e.data) d = Object.assign(d, e.data.json()); }
  catch (_) { if (e.data) d.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: d.url || './' },
    vibrate: [80, 40, 80],
    tag: 'family-mission'
  }));
});

/* 알림 클릭 → 앱 열기/포커스 */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) { try { c.navigate(target); } catch (_) {} return c.focus(); }
    }
    if (clients.openWindow) return clients.openWindow(target);
  }));
});
