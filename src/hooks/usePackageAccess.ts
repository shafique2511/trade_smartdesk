import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { getPackageAccess } from '../lib/packageAccess'

export function usePackageAccess() {
  const { activePackage } = useAuth()
  return useMemo(() => getPackageAccess(activePackage), [activePackage])
}
