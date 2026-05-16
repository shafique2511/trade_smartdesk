import { SystemStatePage } from './SystemStatePage'

export function NotAuthorizedPage() {
  return (
    <SystemStatePage
      description="This route requires admin permissions."
      title="Not authorized"
    >
      <p>
        Your current role does not include access to the admin dashboard. Trader and manager accounts remain limited to trading workspace modules.
      </p>
    </SystemStatePage>
  )
}
