import type { ReactNode } from 'react'
import { usePackageAccess } from '../../hooks/usePackageAccess'
import type { PackageFeature } from '../../types/packageAccess'
import { UpgradePrompt } from './UpgradePrompt'

type FeatureGateProps = {
  children: ReactNode
  feature: PackageFeature
  title?: string
  description?: string
  fallback?: ReactNode
}

export function FeatureGate({ children, description, fallback, feature, title }: FeatureGateProps) {
  const access = usePackageAccess()

  if (access.features[feature]) return children

  return fallback ?? <UpgradePrompt description={description} feature={feature} title={title} />
}
