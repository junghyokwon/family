/* 겸율휘연 가족 액티비티 - 서비스워커 (앱 설치 + 오프라인 셸) */
const CACHE = 'family-app-v1';
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
  // 다른 출처(Supabase, CDN 등)는 건드리지 않고 네트워크 그대로
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  // 같은 출처: 네트워크 우선, 실패하면(오프라인) 캐시로 폴백
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{}); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
