import { SystemStatePage } from './SystemStatePage'

export function AccountDisabledPage() {
  return (
    <SystemStatePage
      description="This account is not currently active."
      title="Account disabled"
    >
      <p>
        Your account has been marked inactive. Contact the workspace administrator before using Trading SmartDesk again.
      </p>
    </SystemStatePage>
  )
}
