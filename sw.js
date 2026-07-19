const CACHE_NAME = 'gerna-transportes-v3';
const ASSETS = [
  './index.html',
  './manifest.json',
  './gerna-logo.svg',
  './favicon.ico',
  './apple-touch-icon.png',
  './icon-36.png',
  './icon-48.png',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Supabase: sempre busca direto na rede, nunca cacheia
  if (url.includes('supabase.co')) return;

  // HTML, manifest e o próprio service worker: rede primeiro (pra sempre pegar a versão mais nova),
  // e só cai no cache se estiver offline. Isso evita ficar preso numa versão antiga do app.
  const isAppShell = event.request.mode === 'navigate' ||
    url.endsWith('index.html') || url.endsWith('manifest.json');

  if (isAppShell){
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Ícones e demais arquivos estáticos: cache primeiro (não mudam com frequência)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
