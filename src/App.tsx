import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PublicLayout } from './components/PublicLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/Home'
const page = <T extends string>(loader: () => Promise<Record<T, React.ComponentType>>, key: T) => lazy(() => loader().then((m) => ({ default: m[key] })))
const OrderPage = page(() => import('./pages/Order'), 'OrderPage')
const TrackPage = page(() => import('./pages/Track'), 'TrackPage')
const ReviewsPage = page(() => import('./pages/Reviews'), 'ReviewsPage')
const PrivacyPage = page(() => import('./pages/Privacy'), 'PrivacyPage')
const ChatPage = page(() => import('./pages/Chat'), 'ChatPage')
const AdminLoginPage = page(() => import('./pages/AdminLogin'), 'AdminLoginPage')
const AdminDashboardPage = page(() => import('./pages/AdminDashboard'), 'AdminDashboardPage')
const AuthPage = page(() => import('./pages/Auth'), 'AuthPage')
const CommunityPage = page(() => import('./pages/Community'), 'CommunityPage')
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-gold-400"><Loader2 className="animate-spin" size={28} /></div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} /><Route path="/order" element={<OrderPage />} /><Route path="/track" element={<TrackPage />} />
            <Route path="/reviews" element={<ReviewsPage />} /><Route path="/privacy" element={<PrivacyPage />} /><Route path="/chat" element={<ChatPage />} />
          </Route>
          <Route path="/account" element={<PublicLayout />}><Route index element={<AuthPage />} /></Route>
          <Route path="/community" element={<PublicLayout />}><Route index element={<CommunityPage />} /></Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
