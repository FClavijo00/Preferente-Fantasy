/*
 * Service worker de Preferente Fantasy: SOLO notificaciones push.
 * No cachea nada (no hay evento "fetch"), así que cada despliegue se ve al momento.
 * Se publica en la raíz (/sw-push.js, ver angular.json) para que su ámbito sea toda la web.
 *
 * El servidor manda un JSON: { title, body, url, tag }.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : '' };
  }

  const titulo = datos.title || 'Preferente Fantasy';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.body || '',
      icon: '/assets/icon/icon-192.png',
      badge: '/assets/icon/badge-96.png',
      tag: datos.tag || undefined,
      data: { url: datos.url || '/' },
      lang: 'es',
    }),
  );
});

/* Al pulsar: si la app ya está abierta, se enfoca y navega; si no, se abre en esa pantalla */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin === self.location.origin) {
          await ventana.focus();
          if ('navigate' in ventana) {
            try {
              await ventana.navigate(destino);
            } catch {
              /* sin control de la ventana: al menos queda enfocada */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(destino);
    })(),
  );
});
