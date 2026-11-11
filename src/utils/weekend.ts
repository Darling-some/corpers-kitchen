import type { MenuItem } from '../types'
export function isItemVisibleToday(item: MenuItem, today: Date = new Date()): boolean {
  if (!item.availableOnDays || item.availableOnDays.length === 0) return true
  return item.availableOnDays.includes(today.getDay())
}
export function visibleMenu(items: MenuItem[], today: Date = new Date()): MenuItem[] {
  return items.filter((i) => isItemVisibleToday(i, today)).sort((a, b) => a.sortOrder - b.sortOrder)
}
