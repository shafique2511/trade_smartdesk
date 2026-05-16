import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { AuthShell } from './AuthShell'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    const { error: resetError } = await resetPassword(email.trim())

    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess('Password reset email sent if the account exists.')
    }

    setIsSubmitting(false)
  }

  return (
    <AuthShell
      description="Request a Supabase password reset email for your Trading SmartDesk account."
      eyebrow="Account recovery"
      title="Reset access without exposing workspace data."
    >
      <GlassCard className="w-full">
        <h2 className="text-2xl font-bold text-white">Forgot password</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="trader@example.com" required type="email" value={email} />
          {error ? <p className="rounded-lg border border-loss-500/30 bg-loss-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          {success ? <p className="rounded-lg border border-profit-500/30 bg-profit-500/10 p-3 text-sm text-green-200">{success}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Sending reset email...' : 'Send reset email'}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          Remembered it? <Link className="font-semibold text-gold-400" to="/login">Back to login</Link>
        </p>
      </GlassCard>
    </AuthShell>
  )
}
