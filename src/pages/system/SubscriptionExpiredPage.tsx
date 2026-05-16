import { SystemStatePage } from './SystemStatePage'

export function SubscriptionExpiredPage() {
  return (
    <SystemStatePage
      description="The current subscription is not active."
      title="Subscription expired"
    >
      <p>
        Your workspace subscription is expired or cancelled. Access will resume when an admin updates the subscription status.
      </p>
    </SystemStatePage>
  )
}
