const BLOCKED = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy']
/** Returns an error message if the text shouldn't be sent, otherwise null.
 * A basic safety net only — real moderation is the admin's delete/mute buttons. */
export function checkChatText(text: string): string | null {
  const t = text.trim()
  if (!t) return 'Type a message first.'
  if (t.length > 200) return 'Keep it under 200 characters.'
  if (/\d[\d\s-]{6,}\d/.test(t)) return "Please don't share phone numbers here."
  if (/https?:\/\/|www\./i.test(t)) return 'Links are not allowed in the Waiting Room.'
  const lower = t.toLowerCase()
  if (BLOCKED.some((w) => lower.includes(w))) return 'Please keep it friendly.'
  return null
}
