/* 서비스 워커: 앱 셸 캐시 → 오프라인에서도 실행 */
const CACHE = 'portfolio-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 앱 셸: 네트워크 우선(업데이트 반영), 실패 시 캐시(오프라인)
  if (e.request.mode === 'navigate' || (url.origin === location.origin && SHELL.some(s => url.pathname.endsWith(s.slice(1))))) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
    );
  }
  // 시세 API 등 외부 요청은 그대로 통과
});
