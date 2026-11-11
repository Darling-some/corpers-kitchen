import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, TrendingUp, Award, Clock3, Timer, Loader2, ListOrdered } from 'lucide-react'
import { fetchOrdersInRange, fetchPhonesForOrders } from '../../lib/orders'
import { revenueOf, bestSellingItem, peakOrderingHour, averagePrepMinutes, ordersToCsv, downloadCsv, salesByItem } from '../../utils/analytics'
import type { Order } from '../../types'
type Range = 'daily' | 'weekly' | 'monthly'
const startOf = (r: Range) => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() - (r === 'daily' ? 0 : r === 'weekly' ? 6 : 29) * 86400000 }
function Metric({ icon: Icon, label, value, loading }: { icon: typeof TrendingUp; label: string; value: string; loading: boolean }) {
  return <div className="glass-card p-4"><Icon size={16} className="text-gold-400" /><p className="mt-2 truncate font-display text-lg font-semibold">{loading ? '—' : value}</p><p className="text-xs text-bone-400">{label}</p></div>
}
export function AnalyticsPanel() {
  const [range, setRange] = useState<Range>('daily')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  useEffect(() => { setLoading(true); fetchOrdersInRange(startOf(range), Date.now()).then(setOrders).finally(() => setLoading(false)) }, [range])
  const sales = useMemo(() => salesByItem(orders), [orders])
  async function exportCsv() { setExporting(true); try { downloadCsv(`corpers-kitchen-${range}-sales.csv`, ordersToCsv(orders, await fetchPhonesForOrders(orders.map((o) => o.id)))) } finally { setExporting(false) } }
  const url = `${window.location.origin}${import.meta.env.BASE_URL}order`
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">{(['daily', 'weekly', 'monthly'] as Range[]).map((r) => <button key={r} onClick={() => setRange(r)} className={`rounded-full border px-4 py-1.5 text-xs capitalize ${range === r ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-400'}`}>{r} report</button>)}</div>
          <button onClick={exportCsv} disabled={loading || exporting || orders.length === 0} className="btn-ghost !px-4 !py-2 text-xs">{exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} Export CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={TrendingUp} label="Revenue" value={`₦${revenueOf(orders).toLocaleString()}`} loading={loading} />
          <Metric icon={Award} label="Best Seller" value={bestSellingItem(orders)} loading={loading} />
          <Metric icon={Clock3} label="Peak Hour" value={peakOrderingHour(orders)} loading={loading} />
          <Metric icon={Timer} label="Avg Prep Time" value={`${averagePrepMinutes(orders)} min`} loading={loading} />
        </div>
        <p className="mt-4 text-xs text-bone-400">{orders.length} order{orders.length === 1 ? '' : 's'} in this range · {orders.filter((o) => o.status === 'delivered').length} completed</p>
        <h3 className="mb-3 mt-6 flex items-center gap-1.5 text-sm font-medium text-bone-100"><ListOrdered size={14} className="text-gold-400" /> Sales by Item</h3>
        {loading ? <div className="skeleton h-40 rounded-2xl" /> : sales.length === 0 ? <p className="text-sm text-bone-400">No paid sales in this range yet.</p> : (
          <div className="glass-card overflow-hidden"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wide text-bone-400"><th className="px-4 py-2.5">Item</th><th className="px-4 py-2.5 text-right">Qty Sold</th><th className="px-4 py-2.5 text-right">Revenue</th></tr></thead>
            <tbody>{sales.map((r) => <tr key={r.name} className="border-b border-white/5 last:border-0"><td className="px-4 py-2.5">{r.name}</td><td className="px-4 py-2.5 text-right font-mono">{r.quantity}</td><td className="px-4 py-2.5 text-right font-mono text-gold-400">₦{r.revenue.toLocaleString()}</td></tr>)}</tbody></table></div>
        )}
      </div>
      <div className="glass-card flex flex-col items-center p-6 text-center">
        <p className="eyebrow mb-4">Scan to Order</p><div className="rounded-2xl bg-white p-4"><QRCodeSVG value={url} size={160} /></div>
        <p className="mt-4 break-all text-xs text-bone-400">{url}</p><p className="mt-2 text-xs text-bone-400">Print this at the counter for instant ordering.</p>
      </div>
    </div>
  )
}
