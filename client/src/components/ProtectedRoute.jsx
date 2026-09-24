import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="auth-loading">Checking your session<span>♡</span></div>
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function PublicOnlyRoute() {
  const { token, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <div className="auth-loading">Checking your session<span>♡</span></div>
  // Keep invitations usable when another account is already signed in on this browser.
  const isInviteLink = new URLSearchParams(location.search).has('invite')
  return token && !isInviteLink ? <Navigate to="/" replace /> : <Outlet />
}

export function AdminRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="auth-loading">Checking your session<span>♡</span></div>
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}
