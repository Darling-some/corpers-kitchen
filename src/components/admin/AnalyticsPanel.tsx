import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, TrendingUp, Award, Clock3, Timer, Loader2 } from 'lucide-react'
import { fetchOrdersInRange, fetchPhonesForOrders } from '../../lib/orders'
import { revenueOf, bestSellingItem, peakOrderingHour, averagePrepMinutes, ordersToCsv, downloadCsv } from '../../utils/analytics'
import type { Order } from '../../types'

type Range = 'daily' | 'weekly' | 'monthly'

function rangeStart(range: Range): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (range === 'daily') return now.getTime()
  if (range === 'weekly') return now.getTime() - 6 * 86400000
  return now.getTime() - 29 * 86400000
}

export function AnalyticsPanel() {
  const [range, setRange] = useState<Range>('daily')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { setLoading(true); fetchOrdersInRange(rangeStart(range), Date.now()).then(setOrders).finally(() => setLoading(false)) }, [range])

  async function handleExport() {
    setExporting(true)
    try {
      const phonesById = await fetchPhonesForOrders(orders.map((o) => o.id))
      downloadCsv(`corpers-kitchen-${range}-sales.csv`, ordersToCsv(orders, phonesById))
    } finally { setExporting(false) }
  }

  const orderUrl = `${window.location.origin}${import.meta.env.BASE_URL}order`

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">{(['daily', 'weekly', 'monthly'] as Range[]).map((r) => <button key={r} onClick={() => setRange(r)} className={`rounded-full border px-4 py-1.5 text-xs capitalize ${range === r ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-400'}`}>{r} report</button>)}</div>
          <button onClick={handleExport} disabled={loading || exporting || orders.length === 0} className="btn-ghost !px-4 !py-2 text-xs">{exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} Export CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={TrendingUp} label="Revenue" value={`₦${revenueOf(orders).toLocaleString()}`} loading={loading} />
          <Metric icon={Award} label="Best Seller" value={bestSellingItem(orders)} loading={loading} />
          <Metric icon={Clock3} label="Peak Hour" value={peakOrderingHour(orders)} loading={loading} />
          <Metric icon={Timer} label="Avg Prep Time" value={`${averagePrepMinutes(orders)} min`} loading={loading} />
        </div>
        <p className="mt-4 text-xs text-bone-400">{orders.length} order{orders.length === 1 ? '' : 's'} in this range · {orders.filter((o) => o.status === 'delivered').length} completed</p>
      </div>
      <div className="glass-card flex flex-col items-center p-6 text-center">
        <p className="eyebrow mb-4">Scan to Order</p>
        <div className="rounded-2xl bg-white p-4"><QRCodeSVG value={orderUrl} size={160} /></div>
        <p className="mt-4 break-all text-xs text-bone-400">{orderUrl}</p>
        <p className="mt-2 text-xs text-bone-400">Print this at the counter for instant ordering.</p>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, loading }: { icon: typeof TrendingUp; label: string; value: string; loading: boolean }) {
  return (<div className="glass-card p-4"><Icon size={16} className="text-gold-400" /><p className="mt-2 truncate font-display text-lg font-semibold">{loading ? '—' : value}</p><p className="text-xs text-bone-400">{label}</p></div>)
}
