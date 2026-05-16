import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { AuthShell } from './AuthShell'

export function RegisterPage() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim())

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess('Account created. Check your email if confirmation is enabled, or continue to the dashboard.')
    }

    setIsSubmitting(false)
  }

  return (
    <AuthShell
      description="Create a trader workspace profile through Supabase Auth."
      eyebrow="Create workspace"
      title="Start with planning, journaling, and transparent risk controls."
    >
      <GlassCard className="w-full">
        <h2 className="text-2xl font-bold text-white">Register</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Full name" onChange={(event) => setFullName(event.target.value)} placeholder="Avery Stone" required value={fullName} />
          <Input label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="trader@example.com" required type="email" value={email} />
          <Input label="Password" onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" required type="password" value={password} />
          {error ? <p className="rounded-lg border border-loss-500/30 bg-loss-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          {success ? <p className="rounded-lg border border-profit-500/30 bg-profit-500/10 p-3 text-sm text-green-200">{success}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          Already registered? <Link className="font-semibold text-gold-400" to="/login">Sign in</Link>
        </p>
      </GlassCard>
    </AuthShell>
  )
}
