export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window
export const notificationPermission = (): NotificationPermission | 'unsupported' => (notificationsSupported() ? Notification.permission : 'unsupported')
export async function requestNotificationPermission(): Promise<NotificationPermission> { return notificationsSupported() ? Notification.requestPermission() : 'denied' }
export function showOrderReadyNotification(orderNumber: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try { new Notification('Your order is ready! 🍜', { body: `${orderNumber} is ready for pickup.`, icon: '/corpers-kitchen/icons/icon-192.png', tag: orderNumber }) } catch { /* not critical */ }
}
