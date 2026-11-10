// App shell cached for offline open; job data is network-first so the latest scan always wins.
const SHELL = "next-role-shell-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL && k !== "next-role-data").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("data.enc.json")) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((r) => { const copy = r.clone(); caches.open("next-role-data").then((c) => c.put("data.enc.json", copy)); return r; })
        .catch(() => caches.open("next-role-data").then((c) => c.match("data.enc.json")))
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
