/*
 * Service worker de Milenew.
 * - La app (HTML, JS, CSS, fuentes, íconos) queda guardada: abre aunque no haya red.
 * - /api NUNCA se guarda: los datos de buses, saldo y viajes siempre vienen frescos del servidor.
 * - Muestra las notificaciones de llegada y abre la app al tocarlas.
 */
const VERSION = 'milenew-v1'
const SHELL = ['/', '/manifest.webmanifest', '/theme-init.js', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return

  // Navegación: red primero (versión nueva), y si no hay red la app guardada
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((cache) => cache.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Archivos con hash (/assets/…), fuentes e íconos: caché primero
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return res
        }),
    ),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/app'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
      if (open) {
        open.navigate(target)
        return open.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
