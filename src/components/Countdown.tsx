import { useEffect, useState } from 'react'

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * A live, ticking countdown to a target timestamp — counts down second by
 * second (11:00 → 10:59 → … → 0:00) instead of showing a static clock
 * time, so the customer can watch it themselves instead of having to take
 * anyone's word for how long is left.
 */
export function Countdown({ targetMillis, className }: { targetMillis: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const remaining = targetMillis - now
  const isDue = remaining <= 0

  return <span className={className}>{isDue ? '0:00' : formatRemaining(remaining)}</span>
}
