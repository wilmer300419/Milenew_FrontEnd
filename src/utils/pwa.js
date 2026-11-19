/** Registro del service worker (solo en producción) y notificaciones del sistema. */

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // sin service worker la app funciona igual, solo que no offline
    })
  })
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

/** Pide permiso para notificaciones. Devuelve true si quedó concedido. */
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

/**
 * Notificación del sistema si hay permiso y la app no está a la vista.
 * Devuelve true si se mostró (si no, quien llama puede usar un aviso dentro de la app).
 */
export async function notify(title, body, url = '/app') {
  if (!notificationsSupported() || Notification.permission !== 'granted' || !document.hidden) return false
  const options = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'milenew-trip', data: { url } }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, options)
    else new Notification(title, options)
    return true
  } catch {
    return false
  }
}
