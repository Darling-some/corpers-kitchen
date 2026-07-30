import { useEffect, useState } from 'react'
import { subscribeMenu } from '../lib/menu'
import { visibleMenu } from '../utils/weekend'
import type { MenuItem } from '../types'

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { const unsub = subscribeMenu((menu) => { setItems(menu); setLoading(false) }); return unsub }, [])
  return { allItems: items, todaysMenu: visibleMenu(items).filter((i) => i.stockStatus !== 'sold_out'), loading }
}
