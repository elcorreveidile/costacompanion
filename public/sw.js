/* Service worker mínimo de Costa Companion.
 * Solo push: mostrar la notificación y abrir la URL al pulsarla.
 * SIN cache de assets (la app es dinámica y server-rendered).
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Costa Companion", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientes) => {
      // Si hay una ventana de la app abierta, navegarla; si no, abrir una nueva.
      for (const cliente of clientes) {
        if ("focus" in cliente) {
          cliente.navigate(url);
          return cliente.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
