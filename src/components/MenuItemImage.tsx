import { useState } from 'react'
import { Utensils } from 'lucide-react'
/** Photo with a clean placeholder if the link is missing or fails to load. */
export function MenuItemImage({ imageUrl, name, className = '', iconSize = 22 }: { imageUrl?: string; name: string; className?: string; iconSize?: number }) {
  const [failed, setFailed] = useState(false)
  if (!imageUrl || failed) return <div className={`flex items-center justify-center bg-ink-800/60 ${className}`}><Utensils size={iconSize} className="text-bone-400/40" /></div>
  return <img src={imageUrl} alt={name} className={`object-cover ${className}`} loading="lazy" onError={() => setFailed(true)} />
}
