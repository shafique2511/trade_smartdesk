import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../ui/LoadingState'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/database'

type ProtectedRouteProps = {
  adminOnly?: boolean
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ adminOnly = false, allowedRoles }: ProtectedRouteProps) {
  const { hasValidSubscription, isActive, isAdmin, loading, profile, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Checking secure session" />

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (!isActive) {
    return <Navigate replace to="/account-disabled" />
  }

  if (!hasValidSubscription) {
    return <Navigate replace to="/subscription-expired" />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate replace to="/not-authorized" />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role ?? 'trader')) {
    return <Navigate replace to="/not-authorized" />
  }

  return <Outlet />
}
