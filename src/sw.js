import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ─── OFFLINE FALLBACK ─────────────────────────────────────────────────────
// For navigation requests (page loads), try network first, fall back to cached shell
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'navigation-cache',
      networkTimeoutSeconds: 5,
    })
  )
)

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Court IQ', body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Court IQ 🏀', {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: data.tag || 'courtiq',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) return w.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
