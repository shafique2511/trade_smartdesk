import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { PageTitle } from '../../components/ui/PageTitle'
import { useAuth } from '../../hooks/useAuth'

type SystemStatePageProps = {
  title: string
  description: string
  children: ReactNode
}

export function SystemStatePage({ children, description, title }: SystemStatePageProps) {
  const { signOut } = useAuth()

  return (
    <>
      <PageTitle description={description} title={title} />
      <GlassCard className="max-w-3xl">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border border-gold-400/40 bg-gold-500/10 p-3 text-gold-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-sm leading-6 text-slate-300">{children}</div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => void signOut()} variant="secondary">
                Sign out
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost">Back to dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    </>
  )
}
