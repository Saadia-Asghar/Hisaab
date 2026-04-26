import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import PoolWallet from './pages/PoolWallet'
import Debts from './pages/Debts'
import Settlement from './pages/Settlement'
import Profile from './pages/Profile'
import { PageWrapper } from './components/layout/PageWrapper'
import { SkeletonList } from './components/ui/Skeleton'

function Protected({ children }) {
  const { session, loading, appReady } = useAuth()

  if (!appReady) {
    return (
      <PageWrapper>
        <div className="card mx-auto mt-20 max-w-sm text-center">
          <p className="text-2xl mb-3">⚙️</p>
          <p className="font-display font-semibold">Setup Required</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Add your Firebase web config to <code className="rounded bg-[var(--bg-surface)] px-1">.env.local</code>
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            VITE_FIREBASE_API_KEY, PROJECT_ID, APP_ID, AUTH_DOMAIN, …
          </p>
        </div>
      </PageWrapper>
    )
  }

  if (loading) {
    return (
      <PageWrapper>
        <SkeletonList />
      </PageWrapper>
    )
  }

  if (!session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/add-expense"
            element={
              <Protected>
                <AddExpense />
              </Protected>
            }
          />
          <Route
            path="/pool"
            element={
              <Protected>
                <PoolWallet />
              </Protected>
            }
          />
          <Route
            path="/debts"
            element={
              <Protected>
                <Debts />
              </Protected>
            }
          />
          <Route
            path="/settlement"
            element={
              <Protected>
                <Settlement />
              </Protected>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
