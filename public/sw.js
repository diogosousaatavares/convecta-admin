/* Service worker — recebe as notificacoes quando o site esta fechado.
   Sem este ficheiro registado, o browser nao entrega push nenhum. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { corpo: e.data && e.data.text() }; }
  const titulo = d.titulo || "Nova marcacao";
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: d.corpo || "",
      icon: d.icone || "/icon-192.png",
      badge: "/icon-192.png",
      tag: d.tag || "convecta",
      renotify: true,
      requireInteraction: !!d.exigeAccao,
      data: { url: d.url || "/" },
      vibrate: [90, 50, 90],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      // Ja esta aberto algures? Traz-se para a frente em vez de abrir outro.
      for (const j of janelas) {
        if (j.url.includes(self.location.origin)) {
          j.navigate(destino);
          return j.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
