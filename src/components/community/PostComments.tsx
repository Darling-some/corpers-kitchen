import { useEffect, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { addComment, watchPostComments } from '../../lib/social'
type CommentItem={id:string;displayName:string;text:string;createdAt?:unknown}
export function PostComments({postId}:{postId:string}){
 const [items,setItems]=useState<CommentItem[]>([]);const [text,setText]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 useEffect(()=>watchPostComments(postId,setItems),[postId])
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setBusy(true);try{await addComment(postId,text);setText('')}catch(err){setError(err instanceof Error?err.message:'Unable to post comment.')}finally{setBusy(false)}}
 return <div className="mt-3 border-t border-white/10 pt-3"><div className="mb-2 flex items-center gap-2 text-xs text-bone-500"><MessageCircle size={14}/>{items.length} comments</div>{items.map(c=><div key={c.id} className="mb-2 rounded-lg bg-ink-900/70 px-3 py-2"><p className="text-[11px] font-semibold text-gold-300">{c.displayName}</p><p className="mt-1 whitespace-pre-wrap text-xs text-bone-200">{c.text}</p></div>)}<form onSubmit={submit} className="mt-3 flex gap-2"><input value={text} onChange={e=>setText(e.target.value)} maxLength={500} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-xs"/><button disabled={busy||!text.trim()} className="rounded-xl bg-ink-700 px-3 text-gold-300 disabled:opacity-40"><Send size={15}/></button></form>{error&&<p className="mt-2 text-xs text-red-300">{error}</p>}</div>
}
