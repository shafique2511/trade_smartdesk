import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LoadingState } from '../ui/LoadingState'

export function PublicOnlyRoute() {
  const { loading, user } = useAuth()

  if (loading) return <LoadingState label="Checking secure session" />

  if (user) return <Navigate replace to="/dashboard" />

  return <Outlet />
}
