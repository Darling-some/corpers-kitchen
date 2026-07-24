import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PublicLayout } from './components/PublicLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/Home'

const OrderPage = lazy(() => import('./pages/Order').then((m) => ({ default: m.OrderPage })))
const TrackPage = lazy(() => import('./pages/Track').then((m) => ({ default: m.TrackPage })))
const ReviewsPage = lazy(() => import('./pages/Reviews').then((m) => ({ default: m.ReviewsPage })))
const AdminLoginPage = lazy(() => import('./pages/AdminLogin').then((m) => ({ default: m.AdminLoginPage })))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboardPage })))

function PageFallback() {
  return <div className="grid min-h-[60vh] place-items-center text-gold-400"><Loader2 className="animate-spin" size={28} /></div>
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
