import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, MessagesSquare, Megaphone, ShieldCheck, Mic, Square, Trash2, Play, Pause } from 'lucide-react'
import { subscribeChatMessages, sendChatMessage, uploadVoiceChatMessage } from '../lib/chat'
import { subscribeOrderByNumber } from '../lib/orders'
import { subscribeChatAnnouncement } from '../lib/settings'
import { getLastOrderNumber, getChatToken } from '../lib/orderRecovery'
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
  const recorder = useRef<MediaRecorder | null>(null)
  const discardRecording = useRef(false)
  const mediaStream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const chatToken = getChatToken()

  useEffect(() => { if (!orderNumber) return; return subscribeOrderByNumber(orderNumber, setOrder) }, [orderNumber])
  const eligible = !!order && order.createdAt >= startOfTodayMillis() && order.status !== 'cancelled'
  useEffect(() => { if (!chatOn || !eligible) return; return subscribeChatMessages(setMessages) }, [chatOn, eligible])
  useEffect(() => { if (!chatOn || !eligible) return; return subscribeChatAnnouncement(setAnnouncement) }, [chatOn, eligible])
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    mediaStream.current?.getTracks().forEach(track => track.stop())
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])
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

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setError('Voice recording is not supported by this browser. Try a recent version of Chrome or Firefox.')
        return
      }
      if (!chatToken) {
        setError('Voice notes require a fresh order session. Please place a new order to enable them.')
        return
      }
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream
      chunks.current = []
      discardRecording.current = false
      const formats = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
      const mimeType = formats.find(type => MediaRecorder.isTypeSupported(type))
      const instance = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder.current = instance
      instance.ondataavailable = event => {
        if (event.data.size > 0) chunks.current.push(event.data)
      }
      instance.onstop = () => {
        if (!discardRecording.current) {
          const blob = new Blob(chunks.current, { type: instance.mimeType || 'audio/webm' })
          if (blob.size > 0) {
            setPreviewBlob(blob)
            setPreviewUrl(URL.createObjectURL(blob))
          }
        }
        discardRecording.current = false
        stream.getTracks().forEach(track => track.stop())
        mediaStream.current = null
      }
      instance.start()
      setRecordingSeconds(0)
      setRecording(true)
      timer.current = setInterval(() => {
        setRecordingSeconds(current => {
          if (current + 1 >= 60) {
            if (recorder.current?.state === 'recording') recorder.current.stop()
            setRecording(false)
            if (timer.current) clearInterval(timer.current)
            timer.current = null
            return 60
          }
          return current + 1
        })
      }, 1000)
    } catch {
      setError('Microphone access was denied or unavailable. Allow microphone permission and try again.')
    }
  }

  function stopRecording() {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setRecording(false)
  }

  function cancelVoice() {
    discardRecording.current = true
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    if (recorder.current?.state === 'recording') recorder.current.stop()
    mediaStream.current?.getTracks().forEach(track => track.stop())
    mediaStream.current = null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setPreviewBlob(null)
    setRecording(false)
    setRecordingSeconds(0)
  }

  async function sendVoice() {
    if (!order || !chatToken || !previewBlob) return
    if (Date.now() - lastSent.current < COOLDOWN_MS) {
      setError('Slow down a little — wait a few seconds between messages.')
      return
    }
    setUploadingVoice(true)
    setError('')
    try {
      await uploadVoiceChatMessage(order.id, chatToken, previewBlob, recordingSeconds)
      lastSent.current = Date.now()
      cancelVoice()
    } catch {
      setError("Couldn't send the voice note. Check your connection or whether the Waiting Room is still open.")
    } finally {
      setUploadingVoice(false)
    }
  }

  function togglePlayback(id: string) {
    const audio = audioRefs.current[id]
    if (!audio) return
    if (playingId === id) {
      audio.pause()
      setPlayingId(null)
    } else {
      Object.entries(audioRefs.current).forEach(([otherId, element]) => {
        if (otherId !== id) element?.pause()
      })
      void audio.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null))
    }
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
                {m.type === 'audio' && m.audioUrl ? (
                  <div className="mt-2 flex min-w-48 items-center gap-2">
                    <button type="button" onClick={() => togglePlayback(m.id)} className="rounded-full bg-gold-400/20 p-2 text-gold-300" aria-label={playingId === m.id ? 'Pause voice note' : 'Play voice note'}>
                      {playingId === m.id ? <Pause size={17} /> : <Play size={17} />}
                    </button>
                    <div className="flex-1">
                      <div className="flex h-6 items-center gap-1" aria-hidden="true">
                        {Array.from({ length: 22 }, (_, i) => <span key={i} className="w-1 rounded-full bg-gold-400/70" style={{ height: `${6 + ((i * 7 + m.id.charCodeAt(i % m.id.length)) % 17)}px` }} />)}
                      </div>
                      <p className="text-[10px] text-bone-400">{m.audioDuration ?? 0}s voice note</p>
                    </div>
                    <audio
                      ref={element => { audioRefs.current[m.id] = element }}
                      src={m.audioUrl}
                      preload="none"
                      onEnded={() => setPlayingId(null)}
                      onPause={() => setPlayingId(current => current === m.id ? null : current)}
                      className="hidden"
                    />
                  </div>
                ) : <p className="break-words text-sm">{m.text}</p>}
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>
      {previewUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold-400/30 bg-ink-800 p-3">
          <audio src={previewUrl} controls className="min-w-0 flex-1" />
          <span className="text-xs text-bone-400">{recordingSeconds}s</span>
          <button type="button" onClick={cancelVoice} disabled={uploadingVoice} className="rounded-lg p-2 text-danger" aria-label="Delete recording"><Trash2 size={18} /></button>
          <button type="button" onClick={sendVoice} disabled={uploadingVoice} className="btn-primary !px-4" aria-label="Send voice note">{uploadingVoice ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}</button>
        </div>
      )}
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Type a message…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-4 py-3 outline-none focus:border-gold-400/60" />
        <button type="submit" disabled={sending || !text.trim() || recording || !!previewBlob} className="btn-primary !px-4" aria-label="Send message">{sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}</button>
        {!previewBlob && (
          <button type="button" onClick={recording ? stopRecording : startRecording} disabled={uploadingVoice || !chatToken} className={`rounded-xl px-4 ${recording ? 'bg-danger text-white' : 'border border-gold-400/40 bg-gold-400/10 text-gold-300'} disabled:opacity-40`} aria-label={recording ? 'Stop recording' : 'Record voice note'}>
            {recording ? <Square size={17} /> : <Mic size={18} />}
          </button>
        )}
      </form>
      {recording && <p className="mt-2 flex items-center gap-2 text-xs text-danger"><span className="h-2 w-2 animate-pulse rounded-full bg-danger" /> Recording… {recordingSeconds}s / 60s <button type="button" onClick={cancelVoice} className="ml-auto text-bone-400 underline">Cancel</button></p>}
      {!chatToken && <p className="mt-2 text-xs text-bone-500">Voice notes are enabled for orders placed after this update. Text chat remains available.</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-6 text-center"><Link to="/track" className="text-xs text-bone-400 hover:text-gold-300">← Back to my order</Link></div>
    </>
  )
}
