export const PREP_MINUTES_PER_ORDER = 11
export function formatClockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit' })
}
export function todayDateKey(): string {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', day: '2-digit', month: '2-digit', year: '2-digit' }).formatToParts(new Date())
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00'
  return `${g('year')}${g('month')}${g('day')}`
}
export function startOfTodayMillis(): number {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return Date.UTC(g('year'), g('month') - 1, g('day')) - 60 * 60 * 1000
}
export function dayBoundsMillis(iso: string): [number, number] {
  const [y, m, d] = iso.split('-').map(Number)
  const start = Date.UTC(y, m - 1, d) - 60 * 60 * 1000
  return [start, start + 24 * 60 * 60 * 1000 - 1]
}
export function formatOrderNumber(dateKey: string, seq: number): string { return `CK-${dateKey}-${String(seq).padStart(3, '0')}` }
