import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { UpgradePage } from './pages/billing/UpgradePage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { MarketWatchPage } from './pages/market/MarketWatchPage'
import { TradePlannerPage } from './pages/planner/TradePlannerPage'
import { RiskDeskPage } from './pages/risk/RiskDeskPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { SignalGeneratorPage } from './pages/signals/SignalGeneratorPage'
import { SmartJournalPage } from './pages/journal/SmartJournalPage'
import { TeamOverviewPage } from './pages/team/TeamOverviewPage'
import { AccountDisabledPage } from './pages/system/AccountDisabledPage'
import { NotAuthorizedPage } from './pages/system/NotAuthorizedPage'
import { SubscriptionExpiredPage } from './pages/system/SubscriptionExpiredPage'
import { TelegramSettingsPage } from './pages/telegram/TelegramSettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/market-watch" element={<MarketWatchPage />} />
          <Route path="/trade-planner" element={<TradePlannerPage />} />
          <Route path="/signals" element={<SignalGeneratorPage />} />
          <Route path="/journal" element={<SmartJournalPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/risk-desk" element={<RiskDeskPage />} />
          <Route path="/telegram" element={<TelegramSettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/team" element={<TeamOverviewPage />} />
        </Route>
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/account-disabled" element={<AccountDisabledPage />} />
        <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
        <Route path="/not-authorized" element={<NotAuthorizedPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
