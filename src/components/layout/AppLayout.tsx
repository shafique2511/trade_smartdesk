import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen((value) => !value)} />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
          <Outlet />
          <footer className="border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500">
            This platform is for trade planning, journaling, and risk management only. It does not provide financial advice.
          </footer>
        </main>
      </div>
    </div>
  )
}
