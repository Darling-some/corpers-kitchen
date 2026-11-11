import { useEffect, useRef, useState } from 'react'
import { Trash2, VolumeX, Volume2, Send, Megaphone, Loader2 } from 'lucide-react'
import { subscribeChatMessages, deleteChatMessage, muteChatUser, unmuteChatUser, subscribeMutes, sendStaffMessage } from '../../lib/chat'
import { subscribeChatAnnouncement, setChatAnnouncement } from '../../lib/settings'
import { formatClockTime } from '../../utils/orderNumber'
import type { ChatMessage, ChatMute } from '../../types'

export function ChatModerationPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mutes, setMutes] = useState<ChatMute[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [announcementSaved, setAnnouncementSaved] = useState('')
  const [staffText, setStaffText] = useState('')
  const [busy, setBusy] = useState(false)
  const loaded = useRef(false)
  useEffect(() => subscribeChatMessages(setMessages), [])
  useEffect(() => subscribeMutes(setMutes), [])
  useEffect(() => subscribeChatAnnouncement((t) => { setAnnouncementSaved(t); if (!loaded.current) { setAnnouncement(t); loaded.current = true } }), [])
  const muted = new Set(mutes.map((m) => m.orderNumber))
  async function run(fn: () => Promise<unknown>) { setBusy(true); try { await fn() } finally { setBusy(false) } }
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="glass-card p-5">
        <h3 className="mb-1 font-display text-lg font-medium">Waiting Room messages</h3>
        <p className="mb-4 text-xs text-bone-400">Latest 50. Delete anything unfriendly, or mute a customer (blocks them from posting for good).</p>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {messages.length === 0 && <p className="text-sm text-bone-400">No messages yet.</p>}
          {[...messages].reverse().map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-ink-900 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs text-bone-400"><span className={m.isStaff ? 'font-semibold text-gold-300' : 'font-medium text-bone-100'}>{m.name}</span>{!m.isStaff && <span className="font-mono"> · {m.orderNumber}</span>} · {formatClockTime(m.createdAt)}</p>
                <p className="break-words text-sm">{m.text}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {!m.isStaff && !muted.has(m.orderNumber) && <button disabled={busy} onClick={() => run(() => muteChatUser(m.orderNumber, m.name))} className="rounded-full border border-white/10 p-1.5 text-bone-300 hover:border-warn/50 hover:text-warn" aria-label={`Mute ${m.name}`} title="Mute this customer"><VolumeX size={13} /></button>}
                <button disabled={busy} onClick={() => run(() => deleteChatMessage(m.id))} className="rounded-full border border-white/10 p-1.5 text-bone-300 hover:border-danger/50 hover:text-danger" aria-label="Delete message" title="Delete message"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="glass-card p-5">
          <h3 className="mb-2 flex items-center gap-1.5 font-display text-lg font-medium"><Megaphone size={16} className="text-gold-400" /> Pinned announcement</h3>
          <p className="mb-2 text-xs text-bone-400">Shows at the top of the Waiting Room. Good for "Today's special is ready at 9pm". Leave empty and save to clear it.</p>
          <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={2} maxLength={200} className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-gold-400/60" />
          <button disabled={busy || announcement.trim() === announcementSaved} onClick={() => run(() => setChatAnnouncement(announcement))} className="btn-primary mt-2 w-full !py-2 text-sm">{busy && <Loader2 className="animate-spin" size={14} />} Save announcement</button>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-2 font-display text-lg font-medium">Post as Corpers Kitchen</h3>
          <form onSubmit={(e) => { e.preventDefault(); if (staffText.trim()) run(async () => { await sendStaffMessage(staffText); setStaffText('') }) }} className="flex gap-2">
            <input value={staffText} onChange={(e) => setStaffText(e.target.value)} maxLength={200} placeholder="Say something to the room…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-gold-400/60" />
            <button type="submit" disabled={busy || !staffText.trim()} className="btn-primary !px-4 !py-2" aria-label="Send"><Send size={15} /></button>
          </form>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-2 font-display text-lg font-medium">Muted customers</h3>
          {mutes.length === 0 ? <p className="text-sm text-bone-400">Nobody is muted.</p> : <div className="space-y-2">{mutes.map((m) => <div key={m.orderNumber} className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm"><span>{m.name} <span className="font-mono text-xs text-bone-400">{m.orderNumber}</span></span><button disabled={busy} onClick={() => run(() => unmuteChatUser(m.orderNumber))} className="flex items-center gap-1 text-xs text-bone-300 hover:text-success"><Volume2 size={13} /> Unmute</button></div>)}</div>}
        </div>
      </div>
    </div>
  )
}
