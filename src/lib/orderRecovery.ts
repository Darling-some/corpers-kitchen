// Solves a real problem: a customer places a bank-transfer order, then
// switches to their banking app to actually pay. On many phones, the OS
// suspends or fully reloads the background browser tab while they're gone
// — and if that happens before the URL ever updated to /track?order=...,
// they come back to a blank page with no idea what their order number was.
//
// Fix: the moment an order is successfully created, its number is saved
// here (plain localStorage, no server round-trip needed) so the tracking
// page can recover it automatically even after a full page reload wiped
// out React's in-memory state and the URL query string.

const KEY = 'ck_last_order_number'

export function saveLastOrderNumber(orderNumber: string): void {
  try {
    localStorage.setItem(KEY, orderNumber)
  } catch {
    // localStorage can be unavailable in rare private-browsing contexts —
    // not critical, just means recovery won't work for this one customer.
  }
}

export function getLastOrderNumber(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearLastOrderNumber(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
