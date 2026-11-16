// Service worker: guarda la "closca" de l'app perquè s'obri ràpid i sense connexió.
// Les dades (Supabase) i els preus (Alpha Vantage) sempre es demanen a la xarxa.
const VERSIO = 'cartera-v2';
const CLOSCA = ['./', './index.html', './config.js', './manifest.webmanifest',
  './icones/icona-192.png', './icones/icona-512.png', './icones/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIO).then(c => c.addAll(CLOSCA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Només es guarden la pròpia app i les llibreries/fonts. Les dades (Supabase, Finnhub, Alpha Vantage...) sempre van a la xarxa.
  const LLIBRERIES = ['cdn.jsdelivr.net','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'];
  if (url.origin !== location.origin && !LLIBRERIES.includes(url.hostname)) return;
  if (url.origin === location.origin) {
    // xarxa primer (per tenir sempre l'última versió), si no hi ha connexió, la còpia guardada
    e.respondWith(fetch(e.request).then(r => {
      const copia = r.clone(); caches.open(VERSIO).then(c => c.put(e.request, copia)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    // llibreries i fonts: còpia guardada primer
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copia = res.clone(); caches.open(VERSIO).then(c => c.put(e.request, copia)); return res;
    })));
  }
});
