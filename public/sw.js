// MedCare service worker — production only.
// Intentionally minimal: handles notification events. We do NOT cache navigation
// requests to avoid serving stale builds.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "MedCare", body: "You have a new notification" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    // ignore parse errors
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/ragaai.jpg",
      badge: "/ragaai.jpg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const url = "/patients";
      for (const c of clients) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
