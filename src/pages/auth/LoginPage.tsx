import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { AuthShell } from './AuthShell'

export function LoginPage() {
  const { authError, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn(email.trim(), password)

    if (signInError) {
      setError(signInError.message)
    }

    setIsSubmitting(false)
  }

  return (
    <AuthShell
      description="Secure Supabase Auth access for the trading workspace."
      eyebrow="Secure access"
      title="Plan trades with structure before anything reaches execution."
    >
      <GlassCard className="w-full">
        <h2 className="text-2xl font-bold text-white">Login</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="trader@example.com" required type="email" value={email} />
          <Input label="Password" onChange={(event) => setPassword(event.target.value)} placeholder="Password" required type="password" value={password} />
          {error || authError ? <p className="rounded-lg border border-loss-500/30 bg-loss-500/10 p-3 text-sm text-red-200">{error ?? authError}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <Link className="mt-4 inline-flex text-sm font-semibold text-gold-400" to="/forgot-password">
          Forgot password?
        </Link>
        <p className="mt-5 text-sm text-slate-400">
          Need an account? <Link className="font-semibold text-gold-400" to="/register">Create one</Link>
        </p>
      </GlassCard>
    </AuthShell>
  )
}
