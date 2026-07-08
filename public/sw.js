// Grupo PSI push service worker
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Grupo PSI", body: event.data && event.data.text() }; }
  const title = data.title || "Grupo PSI";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.png",
    badge: data.badge || "/favicon.png",
    tag: data.tag || "psi-notif",
    renotify: true,
    data: { url: data.url || "/admin", ...(data.data || {}) },
    vibrate: [80, 40, 80],
    requireInteraction: !!data.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      try {
        if ("focus" in c) { await c.focus(); if ("navigate" in c) await c.navigate(url); return; }
      } catch {}
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
