// Network first: online you always get the newest version from GitHub; if GitHub can't be reached,
// answers with an error page, or takes more than a few seconds, the last saved copy opens instead
// (and the newer version still downloads in the background for next time).
// Only the app's own files, fonts and the Firebase library are handled; Firebase's data traffic passes straight through.
const CACHE = "charge-log-v3";
const WAIT_MS = 4000;
const handled = url => url.origin === location.origin || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.href.startsWith("https://www.gstatic.com/firebasejs/");
const good = res => res.ok || res.type === "opaque";   // cross-site font CSS comes back opaque

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || !handled(url)) return;

  const saved = () => caches.match(req, { ignoreSearch: true })
    .then(r => r || (req.mode === "navigate" ? caches.match("./") : undefined));

  // the app's own files skip the 10-minute browser cache and are re-checked every time
  let saving = Promise.resolve();
  const net = fetch(req, url.origin === location.origin ? { cache: "no-cache" } : undefined).then(res => {
    if (good(res)) { const copy = res.clone(); saving = caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  e.waitUntil(net.then(() => saving, () => {}));   // keep downloading even after the saved copy was shown

  e.respondWith(new Promise(resolve => {
    let done = false;
    const give = r => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
    const savedOr = other => saved().then(s => give(s || other));
    const timer = setTimeout(() => saved().then(s => { if (s) give(s); }), WAIT_MS);   // slow: show the saved copy
    net.then(res => good(res) ? give(res) : savedOr(res),   // error page: saved copy if there is one
             () => savedOr(Response.error()));            // no connection
  }));
});
