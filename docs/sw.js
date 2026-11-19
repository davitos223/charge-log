// Network first: online you always get the newest version from GitHub; offline it falls back to the last copy.
// Only the app's own files, fonts and the Firebase library are handled; Firebase's data traffic passes straight through.
const CACHE = "charge-log-v2";
const handled = url => url.origin === location.origin || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.href.startsWith("https://www.gstatic.com/firebasejs/");
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !handled(new URL(req.url))) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./")))
  );
});
