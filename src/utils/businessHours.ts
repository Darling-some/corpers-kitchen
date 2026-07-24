// Corpers Kitchen's real opening hours, in Nigerian (Africa/Lagos) time:
//   Mon–Fri  8:00pm – 10:30pm
//   Sat      8:00am – 10:00am  &  7:00pm – 10:30pm
//   Sun      10:00am – 10:30pm

interface TimeWindow { startMinutes: number; endMinutes: number }

const SCHEDULE: Record<number, TimeWindow[]> = {
  0: [{ startMinutes: 10 * 60, endMinutes: 22 * 60 + 30 }],
  1: [{ startMinutes: 20 * 60, endMinutes: 22 * 60 + 30 }],
  2: [{ startMinutes: 20 * 60, endMinutes: 22 * 60 + 30 }],
  3: [{ startMinutes: 20 * 60, endMinutes: 22 * 60 + 30 }],
  4: [{ startMinutes: 20 * 60, endMinutes: 22 * 60 + 30 }],
  5: [{ startMinutes: 20 * 60, endMinutes: 22 * 60 + 30 }],
  6: [{ startMinutes: 8 * 60, endMinutes: 10 * 60 }, { startMinutes: 19 * 60, endMinutes: 22 * 60 + 30 }],
}

export const SCHEDULE_LINES = [
  'Mon–Fri · 8:00pm – 10:30pm',
  'Sat · 8:00am – 10:00am & 7:00pm – 10:30pm',
  'Sun · 10:00am – 10:30pm',
]

function getLagosNow(): { weekday: number; minutesSinceMidnight: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekdayPart = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const hourPart = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minutePart = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  return { weekday: weekdayNames.indexOf(weekdayPart), minutesSinceMidnight: (hourPart % 24) * 60 + minutePart }
}

export function isShopOpenNow(): boolean {
  const { weekday, minutesSinceMidnight } = getLagosNow()
  const windows = SCHEDULE[weekday] ?? []
  return windows.some((w) => minutesSinceMidnight >= w.startMinutes && minutesSinceMidnight < w.endMinutes)
}
