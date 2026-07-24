/** Today's date in Nigerian (Africa/Lagos) time as YYMMDD — used both as
 * the order-number prefix and as the counter document's ID, so each
 * calendar day naturally starts its own sequence at 001 with no manual
 * reset or scheduled job needed. */
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

/** Epoch millis for the start of today in Nigerian time — used to scope
 * the live queue to today's orders only, so a stray order left over from a
 * previous day never lingers in the active queue or kitchen-clock timing. */
export function startOfTodayMillis(): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  // Africa/Lagos is UTC+1 with no daylight saving, so midnight there is
  // reliably 23:00 UTC the previous day — safe to hardcode the offset.
  return Date.UTC(year, month - 1, day) - 60 * 60 * 1000
}

/** [start, end] epoch millis for a given Nigerian calendar day, from an
 * ISO date string like "2026-07-23" (what an <input type="date"> gives
 * you) — used to look up any past day's orders, not just today's. */
export function dayBoundsMillis(isoDate: string): [number, number] {
  const [year, month, day] = isoDate.split('-').map(Number)
  const startUtc = Date.UTC(year, month - 1, day) - 60 * 60 * 1000
  const endUtc = startUtc + 24 * 60 * 60 * 1000 - 1
  return [startUtc, endUtc]
}

/** CK-{YYMMDD}-{seq}, e.g. CK-240724-001 — resets to 001 each new day
 * (via a per-day counter document keyed by the same date), but stays
 * globally unique forever since the date is baked into the number itself. */
export function formatOrderNumber(dateKey: string, sequence: number): string {
  return `CK-${dateKey}-${String(sequence).padStart(3, '0')}`
}

/** One pot of noodles (or any single per-order dish) takes ~11 minutes by
 * default — the kitchen cooks one order at a time. */
export const PREP_MINUTES_PER_ORDER = 11

/** Formats an absolute epoch-millis timestamp as a Nigerian clock time (e.g. "8:47 PM"). */
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
