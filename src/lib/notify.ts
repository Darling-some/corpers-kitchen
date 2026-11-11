export function playOrderChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx(); const now = ctx.currentTime
    ;[880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0, now + i * 0.15); g.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35)
      o.connect(g); g.connect(ctx.destination); o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.4)
    })
  } catch { /* not critical */ }
}
