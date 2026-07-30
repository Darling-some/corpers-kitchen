export const PREP_MINUTES_PER_ORDER = 11

export function formatClockTime(epochMillis: number): string {
  return new Date(epochMillis).toLocaleTimeString('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function firstNameOrNickname(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Guest'
  return trimmed.split(/\s+/)[0]
}

export function todayDateKey(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).formatToParts(new Date())
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const year = parts.find((p) => p.type === 'year')?.value ?? '00'
  return `${year}${month}${day}`
}

export function startOfTodayMillis(): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return Date.UTC(year, month - 1, day) - 60 * 60 * 1000
}

export function dayBoundsMillis(isoDate: string): [number, number] {
  const [year, month, day] = isoDate.split('-').map(Number)
  const startUtc = Date.UTC(year, month - 1, day) - 60 * 60 * 1000
  const endUtc = startUtc + 24 * 60 * 60 * 1000 - 1
  return [startUtc, endUtc]
}

export function formatOrderNumber(dateKey: string, sequence: number): string {
  return `CK-${dateKey}-${String(sequence).padStart(3, '0')}`
}
