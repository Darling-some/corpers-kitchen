export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return Notification.requestPermission()
}

export function showOrderReadyNotification(orderNumber: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification('Your order is ready! 🍜', {
      body: `${orderNumber} is ready for pickup — come collect it whenever you're set.`,
      icon: '/corpers-kitchen/icons/icon-192.png',
      tag: orderNumber,
    })
  } catch { /* not critical */ }
}
