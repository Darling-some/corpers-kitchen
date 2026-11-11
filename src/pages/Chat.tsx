import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, MessagesSquare, Megaphone, ShieldCheck } from 'lucide-react'
import { subscribeChatMessages, sendChatMessage } from '../lib/chat'
import { subscribeOrderByNumber } from '../lib/orders'
import { subscribeChatAnnouncement } from '../lib/settings'
import { getLastOrderNumber } from '../lib/orderRecovery'
import { useChatEnabled } from '../hooks/useChatEnabled'
import { checkChatText } from '../utils/chatFilter'
import { formatClockTime, startOfTodayMillis } from '../utils/orderNumber'
import type { ChatMessage, Order } from '../types'

const COOLDOWN_MS = 5000

export function ChatPage() {
  const { value: chatOn, loading } = useChatEnabled()
  const orderNumber = getLastOrderNumber()
  const [order, setOrder] = useState<Order | null | undefined>(orderNumber ? undefined : null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const lastSent = useRef(0)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!orderNumber) return; return subscribeOrderByNumber(orderNumber, setOrder) }, [orderNumber])
  const eligible = !!order && order.createdAt >= startOfTodayMillis() && order.status !== 'cancelled'
  useEffect(() => { if (!chatOn || !eligible) return; return subscribeChatMessages(setMessages) }, [chatOn, eligible])
  useEffect(() => { if (!chatOn || !eligible) return; return subscribeChatAnnouncement(setAnnouncement) }, [chatOn, eligible])
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return
    const problem = checkChatText(text)
    if (problem) { setError(problem); return }
    if (Date.now() - lastSent.current < COOLDOWN_MS) { setError('Slow down a little — wait a few seconds between messages.'); return }
    setError(''); setSending(true)
    try { await sendChatMessage(order, text); lastSent.current = Date.now(); setText('') }
    catch { setError("Couldn't send that. You may have been muted, or the chat was just switched off.") } finally { setSending(false) }
  }

  const shell = (children: React.ReactNode) => <section className="mx-auto max-w-2xl px-5 py-16">{children}</section>
  if (loading || order === undefined) return shell(<div className="skeleton h-48 rounded-2xl" />)
  if (!chatOn) return shell(<div className="glass-card p-10 text-center text-bone-400"><MessagesSquare className="mx-auto mb-3 text-gold-400" size={28} />The Waiting Room is closed right now.<div className="mt-4"><Link to="/track" className="btn-ghost !px-4 !py-2 text-sm">Back to my order</Link></div></div>)
  if (!eligible) return shell(<div className="glass-card p-10 text-center text-bone-400"><MessagesSquare className="mx-auto mb-3 text-gold-400" size={28} />The Waiting Room is for customers with an order today. Place an order to join in.<div className="mt-4"><Link to="/order" className="btn-primary !px-4 !py-2 text-sm">Order Now</Link></div></div>)

  return shell(
    <>
      <span className="eyebrow">Waiting Room</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Chat while you wait</h1>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-bone-400"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-gold-400" /> Be kind. Only your first name shows. Don't share phone numbers or links. The kitchen can delete messages and mute anyone who spoils it for others.</p>
      {announcement && <div className="mt-6 flex items-start gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 p-4 text-sm text-gold-300"><Megaphone size={16} className="mt-0.5 shrink-0" />{announcement}</div>}
      <div className="glass-card mt-6 flex h-[26rem] flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="m-auto text-sm text-bone-400">No messages yet — say hi 👋</p>}
        {messages.map((m) => {
          const mine = m.orderNumber === order!.orderNumber
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.isStaff ? 'border border-gold-400/40 bg-gold-400/10' : mine ? 'bg-gold-400/20' : 'bg-ink-700'}`}>
                <p className={`text-[11px] ${m.isStaff ? 'font-semibold text-gold-300' : 'text-bone-400'}`}>{mine ? 'You' : m.name} · {formatClockTime(m.createdAt)}</p>
                <p className="break-words text-sm">{m.text}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Type a message…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-4 py-3 outline-none focus:border-gold-400/60" />
        <button type="submit" disabled={sending || !text.trim()} className="btn-primary !px-5" aria-label="Send message">{sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}</button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-6 text-center"><Link to="/track" className="text-xs text-bone-400 hover:text-gold-300">← Back to my order</Link></div>
    </>
  )
}
